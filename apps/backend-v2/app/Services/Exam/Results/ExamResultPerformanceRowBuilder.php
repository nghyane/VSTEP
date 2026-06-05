<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Models\ExamSession;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingPassage;
use Illuminate\Support\Collection;

final readonly class ExamResultPerformanceRowBuilder
{
    private const SCORE_TYPE_ACCURACY = 'accuracy';

    private const SCORE_TYPE_BAND = 'band';

    private const STATUS_GRADED = 'graded';

    private const STATUS_PENDING = 'pending';

    private const STATUS_FAILED = 'failed';

    private const STATUS_NOT_SUBMITTED = 'not_submitted';

    /**
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array{item_ref_type: string, item_ref_id: string, is_correct: bool}>  $mcqDetail
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     * @return list<array<string, mixed>>
     */
    public function build(
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
            if (($item['score_status'] ?? null) === self::STATUS_FAILED) {
                return self::STATUS_FAILED;
            }
            if (($item['overall_band'] ?? null) === null) {
                return self::STATUS_PENDING;
            }
        }

        return self::STATUS_NOT_SUBMITTED;
    }

    private function assertGraded(string $status): void
    {
        // noop — keep const reference
    }
}
