<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Models\ExamSession;
use App\Services\Contracts\ExamResultDisplayFormatterInterface;
use App\Services\Contracts\ExamResultSummaryBuilderInterface;
use App\Services\ExamScoringService;

final readonly class ExamResultSummaryBuilder implements ExamResultSummaryBuilderInterface
{
    public function __construct(
        private ExamResultDisplayFormatterInterface $formatter,
        private ExamScoringService $scoringService,
    ) {}

    public function build(
        ExamSession $session,
        array $mcqSummary,
        array $scores,
        ?float $overallBand,
        string $vstepLevel,
        array $performanceRows,
        array $writingFeedback,
        array $speakingFeedback,
    ): array {
        $overallApplicable = $this->scoringService->overallApplicable($session);
        $hasPendingJobs = $this->hasStatus($writingFeedback, $speakingFeedback, ExamResultReadModelStatus::PENDING);
        $hasFailedJobs = $this->hasStatus($writingFeedback, $speakingFeedback, ExamResultReadModelStatus::FAILED)
            || collect($performanceRows)->contains(fn (array $row): bool => $row['status'] === ExamResultReadModelStatus::FAILED);
        $scoreStatus = $this->scoreStatus($overallApplicable, $overallBand, $hasPendingJobs, $hasFailedJobs);
        $feedbackStatus = $this->feedbackStatus($session, $writingFeedback, $speakingFeedback);
        $level = $overallBand === null ? null : $this->scoringService->levelForBand($overallBand);

        return [
            'score_status' => $scoreStatus,
            'feedback_status' => $feedbackStatus,
            'has_pending_jobs' => $hasPendingJobs,
            'has_failed_jobs' => $hasFailedJobs,
            'scoring' => $this->scoringService->scoringRules(),
            'display' => $this->displayLabels($scoreStatus, $hasPendingJobs, $overallBand),
            'overall' => [
                'applicable' => $overallApplicable,
                'reason' => $overallApplicable ? null : $this->scoringService->overallNotApplicableReason(),
                'band' => $overallBand,
                'score_on_10' => $overallBand,
                'max_score' => 10.0,
                'vstep_level' => $overallBand === null ? null : $vstepLevel,
                'level' => $level,
                'cefr_level' => null,
                'result_label' => $overallBand === null ? null : ($level['label'] ?? $vstepLevel),
            ],
            'skills' => $this->skillSummaries($session, $scores, $performanceRows, $writingFeedback, $speakingFeedback),
            'mcq' => [
                'correct' => $mcqSummary['score'],
                'total' => $mcqSummary['total'],
                'answered' => $mcqSummary['answered'],
                'wrong' => $mcqSummary['wrong'],
                'unanswered' => $mcqSummary['unanswered'],
                'score_on_10' => $mcqSummary['score_on_10'],
            ],
        ];
    }

    private function displayLabels(string $scoreStatus, bool $hasPendingJobs, ?float $overallBand): array
    {
        return [
            'band_title' => 'Band VSTEP thi thử',
            'band_value' => $this->bandValueLabel($scoreStatus, $overallBand),
            'total_score_title' => 'Điểm tổng theo công thức',
            'total_score_value' => $this->totalScoreValueLabel($scoreStatus, $overallBand),
            'pending_badge_label' => $hasPendingJobs ? $this->formatter->statusLabel(ExamResultReadModelStatus::PENDING) : null,
        ];
    }

    private function bandValueLabel(string $scoreStatus, ?float $overallBand): string
    {
        if ($overallBand !== null) {
            return $this->scoreOnTenLabel($overallBand);
        }

        return match ($scoreStatus) {
            ExamResultReadModelStatus::PENDING => $this->formatter->statusLabel(ExamResultReadModelStatus::PENDING),
            ExamResultReadModelStatus::FAILED => $this->formatter->statusLabel(ExamResultReadModelStatus::FAILED),
            default => $this->formatter->statusLabel(ExamResultReadModelStatus::NONE),
        };
    }

    private function totalScoreValueLabel(string $scoreStatus, ?float $overallBand): string
    {
        if ($overallBand !== null) {
            return $this->scoreOnTenLabel($overallBand);
        }

        return match ($scoreStatus) {
            ExamResultReadModelStatus::PENDING => 'Đang chờ',
            ExamResultReadModelStatus::FAILED => $this->formatter->statusLabel(ExamResultReadModelStatus::FAILED),
            default => $this->formatter->statusLabel(ExamResultReadModelStatus::NONE),
        };
    }

    private function scoreOnTenLabel(float $score): string
    {
        return $this->formatter->scoreOnTenLabel($score);
    }

    /**
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     */
    private function hasStatus(array $writingFeedback, array $speakingFeedback, string $status): bool
    {
        return collect([...$writingFeedback, ...$speakingFeedback])->contains(
            fn (array $item): bool => ($item['score_status'] ?? null) === $status
                || ($item['feedback_status'] ?? null) === $status,
        );
    }

    private function scoreStatus(bool $overallApplicable, ?float $overallBand, bool $hasPendingJobs, bool $hasFailedJobs): string
    {
        if (! $overallApplicable) {
            return ExamResultReadModelStatus::NOT_APPLICABLE;
        }
        if ($overallBand !== null) {
            return ExamResultReadModelStatus::READY;
        }
        if ($hasFailedJobs) {
            return ExamResultReadModelStatus::FAILED;
        }
        if ($hasPendingJobs) {
            return ExamResultReadModelStatus::PENDING;
        }

        return ExamResultReadModelStatus::PARTIAL;
    }

    /**
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     */
    private function feedbackStatus(ExamSession $session, array $writingFeedback, array $speakingFeedback): string
    {
        $skills = $session->selected_skills ?? [];
        if (! in_array('writing', $skills, true) && ! in_array('speaking', $skills, true)) {
            return ExamResultReadModelStatus::NONE;
        }

        $items = [...$writingFeedback, ...$speakingFeedback];
        $expected = (in_array('writing', $skills, true) ? $session->examVersion->writingTasks->count() : 0)
            + (in_array('speaking', $skills, true) ? $session->examVersion->speakingParts->count() : 0);
        if ($items === []) {
            return ExamResultReadModelStatus::NONE;
        }
        if ($this->hasStatus($writingFeedback, $speakingFeedback, ExamResultReadModelStatus::FAILED)) {
            return ExamResultReadModelStatus::FAILED;
        }
        if ($this->hasStatus($writingFeedback, $speakingFeedback, ExamResultReadModelStatus::PENDING)) {
            return ExamResultReadModelStatus::PENDING;
        }

        $readyCount = collect($items)->where('feedback_status', ExamResultReadModelStatus::READY)->count();
        if ($readyCount === $expected) {
            return ExamResultReadModelStatus::READY;
        }
        if ($readyCount > 0) {
            return ExamResultReadModelStatus::PARTIAL;
        }

        return ExamResultReadModelStatus::NONE;
    }

    /**
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array<string, mixed>>  $performanceRows
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     * @return list<array<string, mixed>>
     */
    private function skillSummaries(
        ExamSession $session,
        array $scores,
        array $performanceRows,
        array $writingFeedback,
        array $speakingFeedback,
    ): array {
        $selectedSkills = $session->selected_skills ?? [];
        $labels = ['listening' => 'Nghe', 'reading' => 'Đọc', 'writing' => 'Viết', 'speaking' => 'Nói'];
        $orderedSkills = ['listening', 'reading', 'writing', 'speaking'];
        $overallApplicable = $this->scoringService->overallApplicable($session);
        $rawBySkill = $this->rawPerformanceBySkill($performanceRows);
        $rows = [];

        foreach ($orderedSkills as $skill) {
            if (! in_array($skill, $selectedSkills, true)) {
                continue;
            }

            $score = $scores[$skill] ?? null;
            $status = $this->skillStatus($skill, $score, $writingFeedback, $speakingFeedback);
            $rows[] = [
                'key' => $skill,
                'label' => $labels[$skill],
                'status' => $status,
                'status_label' => $this->formatter->statusLabel($status),
                'score_on_10' => $score,
                'max_score' => 10.0,
                'weight_percent' => 25,
                'contributes_to_overall' => $overallApplicable,
                'raw' => $rawBySkill[$skill] ?? null,
            ];
        }

        return $rows;
    }

    /**
     * @param  list<array<string, mixed>>  $performanceRows
     * @return array<string, array{correct: int, total: int, wrong: int}>
     */
    private function rawPerformanceBySkill(array $performanceRows): array
    {
        $raw = [];
        foreach ($performanceRows as $row) {
            if (($row['score_type'] ?? null) !== 'accuracy') {
                continue;
            }
            $skill = (string) ($row['skill'] ?? '');
            if ($skill === '') {
                continue;
            }

            $current = $raw[$skill] ?? ['correct' => 0, 'total' => 0, 'wrong' => 0];
            $current['correct'] += (int) ($row['correct'] ?? 0);
            $current['total'] += (int) ($row['total'] ?? 0);
            $current['wrong'] += (int) ($row['wrong'] ?? 0);
            $raw[$skill] = $current;
        }

        return $raw;
    }

    /**
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     */
    private function skillStatus(string $skill, ?float $score, array $writingFeedback, array $speakingFeedback): string
    {
        if ($score !== null) {
            return ExamResultReadModelStatus::READY;
        }
        if ($skill === 'listening' || $skill === 'reading') {
            return ExamResultReadModelStatus::NOT_SUBMITTED;
        }

        $items = $skill === 'writing' ? $writingFeedback : $speakingFeedback;
        $writingItems = $skill === 'writing' ? $items : [];
        $speakingItems = $skill === 'speaking' ? $items : [];

        if ($this->hasStatus($writingItems, $speakingItems, ExamResultReadModelStatus::FAILED)) {
            return ExamResultReadModelStatus::FAILED;
        }
        if ($this->hasStatus($writingItems, $speakingItems, ExamResultReadModelStatus::PENDING)) {
            return ExamResultReadModelStatus::PENDING;
        }

        return ExamResultReadModelStatus::NOT_SUBMITTED;
    }
}
