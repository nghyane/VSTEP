<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamWritingSubmission;
use App\Services\Contracts\ExamSessionResultInterface;
use Illuminate\Support\Collection;

final class ExamSessionResultService implements ExamSessionResultInterface
{
    private const SCORE_TYPE_ACCURACY = 'accuracy';

    private const SCORE_TYPE_BAND = 'band';

    private const STATUS_GRADED = 'graded';

    private const STATUS_PENDING = 'pending';

    private const STATUS_NOT_SUBMITTED = 'not_submitted';

    public function __construct(
        private readonly ExamScoringService $scoringService,
        private readonly AssessmentResultDisplayService $displayService,
        private readonly AssessmentDiagnosticsService $diagnosticsService,
    ) {}

    /** @return array<string, mixed> */
    public function get(ExamSession $session): array
    {
        if (! $session->status->isTerminal()) {
            $session->loadMissing('examVersion.exam');

            return [
                'session' => $this->formatSessionSummary($session),
                'exam' => $this->formatExam($session),
                'scores' => null,
                'summary' => $this->emptySummary(),
                'performance_rows' => [],
                'overall_band' => null,
                'level' => 'Chưa có điểm',
                'mcq' => ['score' => 0, 'total' => 0],
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
            'writingSubmissions.assessmentAttempt.result',
            'speakingSubmissions.assessmentAttempt.evidence',
            'speakingSubmissions.assessmentAttempt.result',
            'examVersion.exam',
            'examVersion.listeningSections.items',
            'examVersion.readingPassages.items',
            'examVersion.writingTasks',
            'examVersion.speakingParts',
            'listeningPlayLogs',
        ]);

        $scores = $this->scoringService->getSessionScores($session);
        $mcqDetail = $this->buildMcqDetail($session);
        $mcqSummary = $this->buildMcqSummary($mcqDetail);
        $writingFeedback = $this->buildWritingFeedback($session);
        $speakingFeedback = $this->buildSpeakingFeedback($session);
        $performanceRows = $this->buildPerformanceRows(
            $session,
            $scores,
            $mcqDetail,
            $writingFeedback,
            $speakingFeedback,
        );
        $overallBand = $this->scoringService->getOverallBand($scores);
        $level = $this->scoringService->bandToLevel($overallBand);

        return [
            'session' => $this->formatSessionSummary($session),
            'exam' => $this->formatExam($session),
            'scores' => $scores,
            'summary' => $this->buildSummary($mcqSummary, $overallBand, $level, $performanceRows),
            'performance_rows' => $performanceRows,
            'overall_band' => $overallBand,
            'level' => $level,
            'mcq' => $mcqSummary,
            'mcq_detail' => $mcqDetail,
            'writing_feedback' => $writingFeedback,
            'speaking_feedback' => $speakingFeedback,
            'listening_play_summary' => $this->buildListeningPlaySummary($session),
        ];
    }

    /** @return array<string, mixed> */
    private function formatSessionSummary(ExamSession $session): array
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

    /**
     * Per-item breakdown theo canonical order của đề. Unanswered items vẫn xuất hiện
     * với selected_index=null để FE không phải tự merge version + answers.
     *
     * @return list<array{item_ref_type: string, item_ref_id: string, selected_index: int|null, correct_index: int, is_correct: bool, answered_at: mixed}>
     */
    private function buildMcqDetail(ExamSession $session): array
    {
        $answers = $session->mcqAnswers->keyBy(
            fn (ExamMcqAnswer $answer): string => "{$answer->item_ref_type}:{$answer->item_ref_id}",
        );
        $skills = $session->selected_skills ?? [];
        $rows = [];

        if (in_array('listening', $skills, true)) {
            foreach ($session->examVersion->listeningSections as $section) {
                foreach ($section->items as $item) {
                    $rows[] = $this->mcqDetailRow(
                        'exam_listening_item',
                        $item->id,
                        $item->correct_index,
                        $answers->get("exam_listening_item:{$item->id}"),
                    );
                }
            }
        }

        if (in_array('reading', $skills, true)) {
            foreach ($session->examVersion->readingPassages as $passage) {
                foreach ($passage->items as $item) {
                    $rows[] = $this->mcqDetailRow(
                        'exam_reading_item',
                        $item->id,
                        $item->correct_index,
                        $answers->get("exam_reading_item:{$item->id}"),
                    );
                }
            }
        }

        return $rows;
    }

    /** @return array{item_ref_type: string, item_ref_id: string, selected_index: int|null, correct_index: int, is_correct: bool, answered_at: mixed} */
    private function mcqDetailRow(string $itemRefType, string $itemRefId, int $correctIndex, ?ExamMcqAnswer $answer): array
    {
        $selectedIndex = $answer?->selected_index;

        return [
            'item_ref_type' => $itemRefType,
            'item_ref_id' => $itemRefId,
            'selected_index' => $selectedIndex,
            'correct_index' => $correctIndex,
            'is_correct' => $selectedIndex !== null && $selectedIndex === $correctIndex,
            'answered_at' => $answer?->answered_at,
        ];
    }

    /**
     * @param  list<array{is_correct: bool}>  $mcqDetail
     * @return array{score: int, total: int}
     */
    private function buildMcqSummary(array $mcqDetail): array
    {
        $score = 0;
        foreach ($mcqDetail as $row) {
            if ($row['is_correct']) {
                $score++;
            }
        }

        return ['score' => $score, 'total' => count($mcqDetail)];
    }

    /** @return list<array<string, mixed>> */
    private function buildWritingFeedback(ExamSession $session): array
    {
        return $session->writingSubmissions
            ->map(function (ExamWritingSubmission $submission): array {
                $result = $submission->assessmentAttempt?->result;

                return [
                    'submission_id' => $submission->id,
                    'attempt_id' => $submission->assessmentAttempt?->id,
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
            })
            ->values()
            ->all();
    }

    /** @return list<array<string, mixed>> */
    private function buildSpeakingFeedback(ExamSession $session): array
    {
        return $session->speakingSubmissions
            ->map(function (ExamSpeakingSubmission $submission): array {
                $result = $submission->assessmentAttempt?->result;

                return [
                    'submission_id' => $submission->id,
                    'attempt_id' => $submission->assessmentAttempt?->id,
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
            })
            ->values()
            ->all();
    }

    /**
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array{item_ref_type: string, item_ref_id: string, is_correct: bool}>  $mcqDetail
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     * @return list<array<string, mixed>>
     */
    private function buildPerformanceRows(
        ExamSession $session,
        array $scores,
        array $mcqDetail,
        array $writingFeedback,
        array $speakingFeedback,
    ): array {
        $skills = $session->selected_skills ?? [];
        $correctByItemId = [];
        foreach ($mcqDetail as $row) {
            $correctByItemId[$row['item_ref_id']] = $row['is_correct'];
        }

        $rows = [];
        if (in_array('listening', $skills, true)) {
            $rows = [...$rows, ...$this->listeningPerformanceRows($session, $correctByItemId)];
        }
        if (in_array('reading', $skills, true)) {
            $rows = [...$rows, ...$this->readingPerformanceRows($session, $correctByItemId)];
        }
        if (in_array('writing', $skills, true)) {
            $total = $session->examVersion->writingTasks->count();
            $rows[] = $this->bandPerformanceRow(
                'writing',
                "Viết · {$total} bài",
                $total,
                $scores['writing'],
                $this->bandStatus($writingFeedback, $scores['writing']),
            );
        }
        if (in_array('speaking', $skills, true)) {
            $total = $session->examVersion->speakingParts->count();
            $rows[] = $this->bandPerformanceRow(
                'speaking',
                "Nói · {$total} phần",
                $total,
                $scores['speaking'],
                $this->bandStatus($speakingFeedback, $scores['speaking']),
            );
        }

        return $rows;
    }

    /**
     * @param  array<string, bool>  $correctByItemId
     * @return list<array<string, mixed>>
     */
    private function listeningPerformanceRows(ExamSession $session, array $correctByItemId): array
    {
        return $session->examVersion->listeningSections
            ->groupBy('part')
            ->sortKeys()
            ->map(function (Collection $sections, int|string $part) use ($correctByItemId): array {
                $items = $sections->flatMap(fn (ExamVersionListeningSection $section): Collection => $section->items);

                return $this->accuracyPerformanceRow(
                    'listening',
                    "Nghe · Part {$part}",
                    $items->count(),
                    $items->sum(fn ($item): int => ($correctByItemId[$item->id] ?? false) ? 1 : 0),
                );
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, bool>  $correctByItemId
     * @return list<array<string, mixed>>
     */
    private function readingPerformanceRows(ExamSession $session, array $correctByItemId): array
    {
        return $session->examVersion->readingPassages
            ->map(function (ExamVersionReadingPassage $passage) use ($correctByItemId): array {
                $total = $passage->items->count();
                $correct = $passage->items->sum(
                    fn ($item): int => ($correctByItemId[$item->id] ?? false) ? 1 : 0,
                );

                return $this->accuracyPerformanceRow('reading', "Đọc · {$passage->title}", $total, $correct);
            })
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function accuracyPerformanceRow(string $skill, string $label, int $total, int $correct): array
    {
        $wrong = $total - $correct;

        return [
            'skill' => $skill,
            'label' => $label,
            'score_type' => self::SCORE_TYPE_ACCURACY,
            'status' => self::STATUS_GRADED,
            'total' => $total,
            'correct' => $correct,
            'wrong' => $wrong,
            'accuracy_pct' => $total > 0 ? (int) round($correct / $total * 100) : 0,
            'band' => null,
        ];
    }

    /** @return array<string, mixed> */
    private function bandPerformanceRow(string $skill, string $label, int $total, ?float $band, string $status): array
    {
        return [
            'skill' => $skill,
            'label' => $label,
            'score_type' => self::SCORE_TYPE_BAND,
            'status' => $status,
            'total' => $total,
            'correct' => null,
            'wrong' => null,
            'accuracy_pct' => null,
            'band' => $band,
        ];
    }

    /** @param  list<array<string, mixed>>  $feedback */
    private function bandStatus(array $feedback, ?float $band): string
    {
        if ($band !== null) {
            return self::STATUS_GRADED;
        }

        foreach ($feedback as $item) {
            if (($item['overall_band'] ?? null) === null) {
                return self::STATUS_PENDING;
            }
        }

        return self::STATUS_NOT_SUBMITTED;
    }

    /**
     * @param  array{score: int, total: int}  $mcqSummary
     * @param  list<array<string, mixed>>  $performanceRows
     * @return array<string, mixed>
     */
    private function buildSummary(array $mcqSummary, ?float $overallBand, string $level, array $performanceRows): array
    {
        $mcqTotal = $mcqSummary['total'];

        return [
            'mcq_score' => $mcqSummary['score'],
            'mcq_total' => $mcqTotal,
            'score_on_10' => $mcqTotal > 0 ? round($mcqSummary['score'] / $mcqTotal * 10, 1) : 0.0,
            'overall_band' => $overallBand,
            'level' => $level,
            'has_pending_ai' => collect($performanceRows)->contains(
                fn (array $row): bool => $row['status'] === self::STATUS_PENDING,
            ),
        ];
    }

    /** @return array<string, mixed> */
    private function emptySummary(): array
    {
        return [
            'mcq_score' => 0,
            'mcq_total' => 0,
            'score_on_10' => 0.0,
            'overall_band' => null,
            'level' => 'Chưa có điểm',
            'has_pending_ai' => false,
        ];
    }

    /** @return list<array{section_id: string, part: int, played: bool}> */
    private function buildListeningPlaySummary(ExamSession $session): array
    {
        $playedSectionIds = $session->listeningPlayLogs->pluck('section_id')->all();

        return $session->examVersion->listeningSections
            ->map(fn (ExamVersionListeningSection $section): array => [
                'section_id' => $section->id,
                'part' => $section->part,
                'played' => in_array($section->id, $playedSectionIds, true),
            ])
            ->values()
            ->all();
    }
}
