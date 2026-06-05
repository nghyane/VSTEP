<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\ExamWritingSubmission;
use App\Services\Contracts\ExamResultDisplayFormatterInterface;
use App\Services\Contracts\ExamResultMcqBuilderInterface;
use App\Services\Contracts\ExamResultReadModelInterface;
use App\Services\Contracts\ExamSessionResultInterface;
use App\Services\Exam\Results\ExamResultPerformanceRowBuilder;

final class ExamSessionResultService implements ExamSessionResultInterface
{
    private const STATUS_READY = 'ready';

    private const STATUS_NONE = 'none';

    private const STATUS_PENDING = 'pending';

    private const STATUS_NOT_SUBMITTED = 'not_submitted';

    private const STATUS_FAILED = 'failed';

    public function __construct(
        private readonly ExamScoringService $scoringService,
        private readonly ExamResultMcqBuilderInterface $mcqBuilder,
        private readonly ExamResultDisplayFormatterInterface $resultFormatter,
        private readonly ExamResultReadModelInterface $readModel,
        private readonly AssessmentResultDisplayService $displayService,
        private readonly AssessmentDiagnosticsService $diagnosticsService,
        private readonly ExamResultPerformanceRowBuilder $performanceRowBuilder,
    ) {}

    /** @return array<string, mixed> */
    public function get(ExamSession $session): array
    {
        if (! $session->status->isTerminal()) {
            $session->loadMissing('examVersion.exam');

            return [
                'session' => $this->formatSessionSummary($session, null),
                'exam' => $this->formatExam($session),
                'version' => null,
                'summary' => $this->emptySummary(),
                'review' => ['skills' => [], 'sections' => []],
                'mcq_detail' => [],
                'writing_feedback' => [],
                'speaking_feedback' => [],
                'listening_play_summary' => [],
                'message' => 'Session not yet submitted or graded.',
            ];
        }

        $session->load([
            'mcqAnswers',
            'writingSubmissions.assessmentAttempt.evidence',
            'writingSubmissions.assessmentAttempt.job',
            'writingSubmissions.assessmentAttempt.result',
            'speakingSubmissions.assessmentAttempt.evidence',
            'speakingSubmissions.assessmentAttempt.job',
            'speakingSubmissions.assessmentAttempt.result',
            'examVersion.exam',
            'examVersion.listeningSections.items',
            'examVersion.readingPassages.items',
            'examVersion.writingTasks',
            'examVersion.speakingParts',
            'listeningPlayLogs',
        ]);

        $scores = $this->scoringService->getSessionScores($session);
        $mcqDetail = $this->mcqBuilder->detail($session);
        $mcqSummary = $this->mcqBuilder->summary($mcqDetail);
        $writingFeedback = $this->buildWritingFeedback($session);
        $speakingFeedback = $this->buildSpeakingFeedback($session);
        $performanceRows = $this->performanceRowBuilder->build(
            $session,
            $scores,
            $mcqDetail,
            $writingFeedback,
            $speakingFeedback,
        );
        $overallBand = $this->scoringService->getOverallBand($scores);
        $vstepLevel = $this->scoringService->bandToVstepLevel($overallBand);
        $readModel = $this->readModel->build(
            $session,
            $mcqSummary,
            $scores,
            $mcqDetail,
            $overallBand,
            $vstepLevel,
            $performanceRows,
            $writingFeedback,
            $speakingFeedback,
        );

        return [
            'session' => $this->formatSessionSummary($session, $scores),
            'exam' => $this->formatExam($session),
            'version' => $session->examVersion,
            'summary' => $readModel['summary'],
            'review' => $readModel['review'],
            'mcq_detail' => $mcqDetail,
            'writing_feedback' => $writingFeedback,
            'speaking_feedback' => $speakingFeedback,
            'listening_play_summary' => $this->buildListeningPlaySummary($session),
        ];
    }

    /** @return array<string, mixed> */
    /** @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}|null  $scores */
    private function formatSessionSummary(ExamSession $session, ?array $scores): array
    {
        return [
            'id' => $session->id,
            'exam_id' => $session->examVersion?->exam_id,
            'exam_version_id' => $session->exam_version_id,
            'mode' => $session->mode,
            'is_full_test' => $session->is_full_test,
            'selected_skills' => $session->selected_skills,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'submitted_at' => $session->submitted_at,
            'server_deadline_at' => $session->server_deadline_at,
            'coins_charged' => $session->coins_charged,
            'scores' => $scores,
        ];
    }

    /** @return array{id: string, title: string}|null */
    private function formatExam(ExamSession $session): ?array
    {
        $exam = $session->examVersion?->exam;
        if ($exam === null) {
            return null;
        }

        return [
            'id' => $exam->id,
            'title' => $exam->title,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function buildWritingFeedback(ExamSession $session): array
    {
        $skills = $session->selected_skills ?? [];
        if (! in_array('writing', $skills, true)) {
            return $this->buildLegacyWritingFeedback($session);
        }

        $submissionsByTaskId = $session->writingSubmissions->keyBy('task_id');

        return $session->examVersion->writingTasks
            ->sortBy('part')
            ->values()
            ->map(function (ExamVersionWritingTask $task) use ($submissionsByTaskId): array {
                /** @var ExamWritingSubmission|null $submission */
                $submission = $submissionsByTaskId->get($task->id);
                if ($submission === null || trim($submission->text) === '') {
                    return $this->blankWritingFeedback($task, $submission);
                }

                return $this->writingFeedbackFromSubmission($submission);
            })
            ->all();
    }

    /** @return array<string, mixed> */
    private function writingFeedbackFromSubmission(ExamWritingSubmission $submission): array
    {
        $result = $submission->assessmentAttempt?->result;
        $jobStatus = $submission->assessmentAttempt?->job?->status;

        return [
            'submission_id' => $submission->id,
            'attempt_id' => $submission->assessmentAttempt?->id,
            'job_status' => $jobStatus?->value,
            'score_status' => $this->assessmentScoreStatus($result !== null, $jobStatus),
            'feedback_status' => $this->assessmentFeedbackStatus($result?->feedback !== null, $result !== null, $jobStatus),
            'task_id' => $submission->task_id,
            'word_count' => $submission->word_count,
            'text' => $submission->text,
            'overall_band' => $result?->overall_band,
            'criterion_scores' => $result?->criterion_scores,
            'caps_applied' => $result?->caps_applied,
            'display' => $result === null ? null : $this->displayService->forResult($result),
            'diagnostics' => $result === null ? null : $this->diagnosticsService->forAttempt($submission->assessmentAttempt),
            'feedback' => $result?->feedback,
            'calculation_trace' => $result?->calculation_trace,
        ];
    }

    /** @return array<string, mixed> */
    private function blankWritingFeedback(ExamVersionWritingTask $task, ?ExamWritingSubmission $submission): array
    {
        return [
            'submission_id' => $submission?->id,
            'attempt_id' => null,
            'job_status' => null,
            'score_status' => self::STATUS_READY,
            'feedback_status' => self::STATUS_NONE,
            'task_id' => $task->id,
            'word_count' => 0,
            'text' => '',
            'overall_band' => 0.0,
            'criterion_scores' => [],
            'caps_applied' => [],
            'display' => null,
            'diagnostics' => null,
            'feedback' => null,
            'calculation_trace' => ['source' => 'blank_submission'],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function buildLegacyWritingFeedback(ExamSession $session): array
    {
        return $session->writingSubmissions
            ->map(fn (ExamWritingSubmission $submission): array => $this->writingFeedbackFromSubmission($submission))
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function buildSpeakingFeedback(ExamSession $session): array
    {
        $skills = $session->selected_skills ?? [];
        if (! in_array('speaking', $skills, true)) {
            return $this->buildLegacySpeakingFeedback($session);
        }

        $submissionsByPartId = $session->speakingSubmissions->keyBy('part_id');

        return $session->examVersion->speakingParts
            ->sortBy('part')
            ->values()
            ->map(function (ExamVersionSpeakingPart $part) use ($submissionsByPartId): array {
                /** @var ExamSpeakingSubmission|null $submission */
                $submission = $submissionsByPartId->get($part->id);
                if ($submission === null) {
                    return $this->blankSpeakingFeedback($part);
                }

                return $this->speakingFeedbackFromSubmission($submission);
            })
            ->all();
    }

    /** @return array<string, mixed> */
    private function speakingFeedbackFromSubmission(ExamSpeakingSubmission $submission): array
    {
        $result = $submission->assessmentAttempt?->result;
        $jobStatus = $submission->assessmentAttempt?->job?->status;

        return [
            'submission_id' => $submission->id,
            'attempt_id' => $submission->assessmentAttempt?->id,
            'job_status' => $jobStatus?->value,
            'score_status' => $this->assessmentScoreStatus($result !== null, $jobStatus),
            'feedback_status' => $this->assessmentFeedbackStatus($result?->feedback !== null, $result !== null, $jobStatus),
            'part_id' => $submission->part_id,
            'audio_url' => $submission->audio_url,
            'transcript' => $submission->transcript,
            'overall_band' => $result?->overall_band,
            'criterion_scores' => $result?->criterion_scores,
            'caps_applied' => $result?->caps_applied,
            'display' => $result === null ? null : $this->displayService->forResult($result),
            'diagnostics' => $result === null ? null : $this->diagnosticsService->forAttempt($submission->assessmentAttempt),
            'feedback' => $result?->feedback,
            'calculation_trace' => $result?->calculation_trace,
        ];
    }

    /** @return array<string, mixed> */
    private function blankSpeakingFeedback(ExamVersionSpeakingPart $part): array
    {
        return [
            'submission_id' => null,
            'attempt_id' => null,
            'job_status' => null,
            'score_status' => self::STATUS_READY,
            'feedback_status' => self::STATUS_NONE,
            'part_id' => $part->id,
            'audio_url' => null,
            'transcript' => null,
            'overall_band' => 0.0,
            'criterion_scores' => [],
            'caps_applied' => [],
            'display' => null,
            'diagnostics' => null,
            'feedback' => null,
            'calculation_trace' => ['source' => 'blank_submission'],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function buildLegacySpeakingFeedback(ExamSession $session): array
    {
        return $session->speakingSubmissions
            ->map(fn (ExamSpeakingSubmission $submission): array => $this->speakingFeedbackFromSubmission($submission))
            ->values()
            ->all();
    }

    private function assessmentScoreStatus(bool $hasResult, ?AssessmentJobStatus $jobStatus): string
    {
        if ($hasResult) {
            return self::STATUS_READY;
        }

        return match ($jobStatus) {
            AssessmentJobStatus::Pending, AssessmentJobStatus::Processing => self::STATUS_PENDING,
            AssessmentJobStatus::Failed => self::STATUS_FAILED,
            default => self::STATUS_NOT_SUBMITTED,
        };
    }

    private function assessmentFeedbackStatus(bool $hasFeedback, bool $hasResult, ?AssessmentJobStatus $jobStatus): string
    {
        if ($hasFeedback) {
            return self::STATUS_READY;
        }
        if ($hasResult) {
            return match ($jobStatus) {
                AssessmentJobStatus::Pending, AssessmentJobStatus::Processing => self::STATUS_PENDING,
                AssessmentJobStatus::Failed => self::STATUS_FAILED,
                default => self::STATUS_NONE,
            };
        }

        return match ($jobStatus) {
            AssessmentJobStatus::Pending, AssessmentJobStatus::Processing => self::STATUS_PENDING,
            AssessmentJobStatus::Failed => self::STATUS_FAILED,
            default => self::STATUS_NOT_SUBMITTED,
        };
    }

    /** @return array<string, mixed> */
    private function emptySummary(): array
    {
        return [
            'score_status' => 'none',
            'feedback_status' => 'none',
            'has_pending_jobs' => false,
            'has_failed_jobs' => false,
            'display' => [
                'band_title' => 'Band VSTEP thi thử',
                'band_value' => $this->resultFormatter->statusLabel(self::STATUS_NONE),
                'total_score_title' => 'Điểm tổng theo công thức',
                'total_score_value' => $this->resultFormatter->statusLabel(self::STATUS_NONE),
                'pending_badge_label' => null,
            ],
            'overall' => [
                'applicable' => false,
                'reason' => null,
                'band' => null,
                'score_on_10' => null,
                'cefr_level' => null,
                'result_label' => null,
            ],
            'mcq' => [
                'correct' => 0,
                'total' => 0,
                'answered' => 0,
                'wrong' => 0,
                'unanswered' => 0,
                'score_on_10' => 0.0,
            ],
        ];
    }

    /** @return list<array{section_id: string, part: int, played: bool, played_at: mixed}> */
    private function buildListeningPlaySummary(ExamSession $session): array
    {
        $logs = $session->listeningPlayLogs->keyBy('section_id');

        return $session->examVersion->listeningSections
            ->map(function (ExamVersionListeningSection $section) use ($logs): array {
                /** @var ExamListeningPlayLog|null $log */
                $log = $logs->get($section->id);

                return [
                    'section_id' => $section->id,
                    'part' => $section->part,
                    'played' => $log !== null,
                    'played_at' => $log?->played_at,
                ];
            })
            ->values()
            ->all();
    }
}
