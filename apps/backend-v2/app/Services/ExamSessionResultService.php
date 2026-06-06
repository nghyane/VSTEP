<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Models\AssessmentAttempt;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\ExamWritingSubmission;
use App\Models\TeacherGradingRequest;
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
            'result_summary' => $scores === null ? null : $this->scoringService->sessionScoreSummary($session, $scores),
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
        $feedback = $this->coachFeedback($result?->feedback);
        $scoreInsights = $this->scoreInsights($result?->feedback);
        $teacherGradingRequest = $this->loadTeacherGradingRequest($submission->assessmentAttempt);

        return [
            'submission_id' => $submission->id,
            'attempt_id' => $submission->assessmentAttempt?->id,
            'job_status' => $jobStatus?->value,
            'score_status' => $this->assessmentScoreStatus($result !== null, $jobStatus),
            'feedback_status' => $this->assessmentFeedbackStatus($feedback !== null, $result !== null, $jobStatus),
            'task_id' => $submission->task_id,
            'word_count' => $submission->word_count,
            'text' => $submission->text,
            'overall_band' => $result?->overall_band,
            'criterion_scores' => $result?->criterion_scores,
            'caps_applied' => $result?->caps_applied,
            'display' => $result === null ? null : $this->displayService->forResult($result),
            'diagnostics' => $result === null ? null : $this->diagnosticsService->forAttempt($submission->assessmentAttempt),
            'score_insights' => $scoreInsights,
            'feedback' => $feedback,
            'calculation_trace' => $result?->calculation_trace,
            'teacher_grading_request' => $this->teacherGradingRequestState($teacherGradingRequest, $result !== null),
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
            'score_insights' => [],
            'feedback' => null,
            'calculation_trace' => ['source' => 'blank_submission'],
            'teacher_grading_request' => null,
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
        $feedback = $this->coachFeedback($result?->feedback);
        $scoreInsights = $this->scoreInsights($result?->feedback);
        $teacherGradingRequest = $this->loadTeacherGradingRequest($submission->assessmentAttempt);

        return [
            'submission_id' => $submission->id,
            'attempt_id' => $submission->assessmentAttempt?->id,
            'job_status' => $jobStatus?->value,
            'score_status' => $this->assessmentScoreStatus($result !== null, $jobStatus),
            'feedback_status' => $this->assessmentFeedbackStatus($feedback !== null, $result !== null, $jobStatus),
            'part_id' => $submission->part_id,
            'audio_url' => $submission->audio_url,
            'transcript' => $submission->transcript
                ?? $submission->assessmentAttempt?->evidence?->signals['speech']['transcript'] ?? null,
            'overall_band' => $result?->overall_band,
            'criterion_scores' => $result?->criterion_scores,
            'caps_applied' => $result?->caps_applied,
            'display' => $result === null ? null : $this->displayService->forResult($result),
            'diagnostics' => $result === null ? null : $this->diagnosticsService->forAttempt($submission->assessmentAttempt),
            'score_insights' => $scoreInsights,
            'feedback' => $feedback,
            'calculation_trace' => $result?->calculation_trace,
            'teacher_grading_request' => $this->teacherGradingRequestState($teacherGradingRequest, $result !== null),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $feedback
     * @return list<array{key: string, label: string, detail: string}>
     */
    private function scoreInsights(?array $feedback): array
    {
        $notes = $feedback['evidenceNotes'] ?? null;
        if (! is_array($notes)) {
            return [];
        }

        $rows = [];
        foreach ($notes as $key => $note) {
            if (is_string($note) && trim($note) !== '') {
                $rows[] = ['key' => (string) $key, 'label' => 'Phân tích', 'detail' => $note];

                continue;
            }

            if (! is_array($note)) {
                continue;
            }

            $label = $note['label'] ?? null;
            $detail = $note['detail'] ?? null;
            if (! is_string($label) || trim($label) === '' || ! is_string($detail) || trim($detail) === '') {
                continue;
            }

            $rows[] = ['key' => (string) $key, 'label' => $label, 'detail' => $detail];
        }

        return $rows;
    }

    /** @param  array<string, mixed>|null  $feedback */
    private function coachFeedback(?array $feedback): ?array
    {
        if ($feedback === null) {
            return null;
        }

        $payload = [
            'strengths' => $this->stringList($feedback['strengths'] ?? []),
            'improvements' => $this->feedbackItems($feedback['improvements'] ?? []),
            'warnings' => $this->stringList($feedback['warnings'] ?? []),
            'rewrites' => $this->rewriteItems($feedback['rewrites'] ?? []),
        ];

        foreach (['strengths', 'improvements', 'rewrites'] as $key) {
            if ($payload[$key] !== []) {
                return $payload;
            }
        }

        return null;
    }

    /** @return list<string> */
    private function stringList(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_filter($items, fn (mixed $item): bool => is_string($item) && trim($item) !== ''));
    }

    /** @return list<string|array{message: string, explanation?: string}> */
    private function feedbackItems(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_filter(array_map(function (mixed $item): string|array|null {
            if (is_string($item)) {
                return trim($item) === '' ? null : $item;
            }
            if (! is_array($item) || ! is_string($item['message'] ?? null) || trim($item['message']) === '') {
                return null;
            }

            $normalized = ['message' => $item['message']];
            if (is_string($item['explanation'] ?? null) && trim($item['explanation']) !== '') {
                $normalized['explanation'] = $item['explanation'];
            }

            return $normalized;
        }, $items)));
    }

    /** @return list<string|array{original: string, improved: string, reason?: string}> */
    private function rewriteItems(mixed $items): array
    {
        if (! is_array($items)) {
            return [];
        }

        return array_values(array_filter(array_map(function (mixed $item): string|array|null {
            if (is_string($item)) {
                return trim($item) === '' ? null : $this->normalizeRewriteString($item);
            }
            if (
                ! is_array($item)
                || ! is_string($item['original'] ?? null)
                || ! is_string($item['improved'] ?? null)
                || trim($item['original']) === ''
                || trim($item['improved']) === ''
            ) {
                return null;
            }

            $normalized = [
                'original' => $item['original'],
                'improved' => $item['improved'],
            ];
            if (is_string($item['reason'] ?? null) && trim($item['reason']) !== '') {
                $normalized['reason'] = $item['reason'];
            }

            return $normalized;
        }, $items)));
    }

    private function normalizeRewriteString(string $rewrite): string|array
    {
        if (! preg_match('/Original:\s*(.*?)\s*→\s*Improved:\s*(.*)/i', $rewrite, $matches)) {
            return $rewrite;
        }

        return [
            'original' => trim($matches[1]),
            'improved' => trim($matches[2]),
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
            'score_insights' => [],
            'feedback' => null,
            'calculation_trace' => ['source' => 'blank_submission'],
            'teacher_grading_request' => null,
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
            'scoring' => $this->scoringService->scoringRules(),
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
                'max_score' => 10.0,
                'vstep_level' => null,
                'cefr_level' => null,
                'level' => null,
                'result_label' => null,
            ],
            'skills' => [],
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

    private function loadTeacherGradingRequest(?AssessmentAttempt $attempt): ?TeacherGradingRequest
    {
        if ($attempt === null) {
            return null;
        }

        return TeacherGradingRequest::query()
            ->with(['assignedTeacher:id,full_name,email', 'teacherResult'])
            ->where('attempt_id', $attempt->id)
            ->first();
    }

    /** @return array<string, mixed> */
    private function teacherGradingRequestState(?TeacherGradingRequest $request, bool $canRequest): array
    {
        if ($request === null) {
            return [
                'can_request' => $canRequest,
                'requested' => false,
                'request_id' => null,
                'status' => 'none',
                'assigned_teacher' => null,
                'requested_at' => null,
                'assigned_at' => null,
                'completed_at' => null,
                'teacher_result' => null,
            ];
        }

        return [
            'can_request' => $canRequest,
            'requested' => true,
            'request_id' => $request->id,
            'status' => $request->status->value,
            'assigned_teacher' => $request->assignedTeacher === null ? null : [
                'id' => $request->assignedTeacher->id,
                'full_name' => $request->assignedTeacher->full_name,
                'email' => $request->assignedTeacher->email,
            ],
            'requested_at' => $request->requested_at,
            'assigned_at' => $request->assigned_at,
            'completed_at' => $request->completed_at,
            'teacher_result' => $request->teacherResult === null ? null : [
                'id' => $request->teacherResult->id,
                'overall_band' => $request->teacherResult->overall_band,
                'criterion_scores' => $request->teacherResult->criterion_scores,
                'feedback' => $request->teacherResult->feedback,
                'submitted_at' => $request->teacherResult->submitted_at,
                'source' => 'teacher',
            ],
        ];
    }
}
