<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Models\ExamSession;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingPassage;
use App\Services\Contracts\ExamResultDisplayFormatterInterface;
use App\Services\Contracts\ExamResultReviewBuilderInterface;
use Illuminate\Support\Collection;

final readonly class ExamResultReviewBuilder implements ExamResultReviewBuilderInterface
{
    private const SOURCE_LISTENING_PART = 'exam_listening_part';

    private const SOURCE_READING_PASSAGE = 'exam_reading_passage';

    private const SOURCE_WRITING_TASK = 'exam_writing_task';

    private const SOURCE_SPEAKING_PART = 'exam_speaking_part';

    public function __construct(
        private ExamResultDisplayFormatterInterface $formatter,
    ) {}

    public function build(
        ExamSession $session,
        array $scores,
        array $mcqDetail,
        array $writingFeedback,
        array $speakingFeedback,
    ): array {
        $skills = $session->selected_skills ?? [];
        $mcqByItemId = collect($mcqDetail)->keyBy(
            fn (array $row): string => ($row['item_ref_type'] ?? '').':'.($row['item_ref_id'] ?? ''),
        );
        $sections = [];

        if (in_array('listening', $skills, true)) {
            $sections = [...$sections, ...$this->listeningSections($session, $mcqByItemId)];
        }
        if (in_array('reading', $skills, true)) {
            $sections = [...$sections, ...$this->readingSections($session, $mcqByItemId)];
        }
        if (in_array('writing', $skills, true)) {
            $sections = [...$sections, ...$this->writingSections($session, $writingFeedback)];
        }
        if (in_array('speaking', $skills, true)) {
            $sections = [...$sections, ...$this->speakingSections($session, $speakingFeedback)];
        }

        return [
            'skills' => $this->skillRows($skills, $scores, $sections),
            'sections' => $sections,
        ];
    }

    /** @param  Collection<string, array<string, mixed>>  $mcqByItemId */
    private function listeningSections(ExamSession $session, Collection $mcqByItemId): array
    {
        return $session->examVersion->listeningSections
            ->groupBy('part')
            ->sortKeys()
            ->map(function (Collection $sections, int|string $part) use ($mcqByItemId): array {
                $items = $sections->flatMap(fn (ExamVersionListeningSection $section): Collection => $section->items);
                $score = $this->scoreItems('exam_listening_item', $items, $mcqByItemId);
                $first = $sections->sortBy('display_order')->first();

                return $this->section(
                    id: "listen-{$part}",
                    skill: 'listening',
                    label: "Part {$part}".($first?->part_title ? " · {$first->part_title}" : ''),
                    shortLabel: "P{$part}",
                    scoreLabel: "{$score['correct']}/{$score['total']}",
                    status: ExamResultReadModelStatus::READY,
                    issueCount: $score['issue_count'],
                    sourceType: self::SOURCE_LISTENING_PART,
                    sourceId: $first?->id,
                    part: (int) $part,
                    displayOrder: (int) ($first?->display_order ?? 0),
                );
            })
            ->values()
            ->all();
    }

    /** @param  Collection<string, array<string, mixed>>  $mcqByItemId */
    private function readingSections(ExamSession $session, Collection $mcqByItemId): array
    {
        return $session->examVersion->readingPassages
            ->sortBy('part')
            ->map(function (ExamVersionReadingPassage $passage) use ($mcqByItemId): array {
                $score = $this->scoreItems('exam_reading_item', $passage->items, $mcqByItemId);

                return $this->section(
                    id: "read-{$passage->part}",
                    skill: 'reading',
                    label: "Đoạn {$passage->part} · {$passage->title}",
                    shortLabel: "Đ{$passage->part}",
                    scoreLabel: "{$score['correct']}/{$score['total']}",
                    status: ExamResultReadModelStatus::READY,
                    issueCount: $score['issue_count'],
                    sourceType: self::SOURCE_READING_PASSAGE,
                    sourceId: $passage->id,
                    part: (int) $passage->part,
                    displayOrder: (int) $passage->display_order,
                );
            })
            ->values()
            ->all();
    }

    /** @param  list<array<string, mixed>>  $writingFeedback */
    private function writingSections(ExamSession $session, array $writingFeedback): array
    {
        $feedbackByTaskId = collect($writingFeedback)->keyBy('task_id');

        return $session->examVersion->writingTasks
            ->sortBy('part')
            ->values()
            ->map(function ($task, int $index) use ($feedbackByTaskId): array {
                /** @var array<string, mixed>|null $feedback */
                $feedback = $feedbackByTaskId->get($task->id);
                $status = $this->sectionStatus($feedback);
                $band = $feedback['overall_band'] ?? null;

                return $this->section(
                    id: 'writing-'.($index + 1),
                    skill: 'writing',
                    label: 'Bài '.($index + 1)." · Part {$task->part}",
                    shortLabel: 'B'.($index + 1),
                    scoreLabel: $band === null ? $this->statusLabel($status) : 'Band '.round((float) $band, 1),
                    status: $status,
                    issueCount: $feedback === null
                        ? 0
                        : count($feedback['diagnostics']['annotations'] ?? []) + count($feedback['feedback']['improvements'] ?? []),
                    sourceType: self::SOURCE_WRITING_TASK,
                    sourceId: $task->id,
                    part: (int) $task->part,
                    displayOrder: (int) $task->display_order,
                );
            })
            ->all();
    }

    /** @param  list<array<string, mixed>>  $speakingFeedback */
    private function speakingSections(ExamSession $session, array $speakingFeedback): array
    {
        $feedbackByPartId = collect($speakingFeedback)->keyBy('part_id');

        return $session->examVersion->speakingParts
            ->sortBy('part')
            ->values()
            ->map(function ($part, int $index) use ($feedbackByPartId): array {
                /** @var array<string, mixed>|null $feedback */
                $feedback = $feedbackByPartId->get($part->id);
                $status = $this->sectionStatus($feedback);
                $band = $feedback['overall_band'] ?? null;

                return $this->section(
                    id: 'speaking-'.($index + 1),
                    skill: 'speaking',
                    label: 'Phần '.($index + 1)." · Part {$part->part}",
                    shortLabel: 'P'.($index + 1),
                    scoreLabel: $band === null ? $this->statusLabel($status) : 'Band '.round((float) $band, 1),
                    status: $status,
                    issueCount: $feedback === null ? 0 : count($feedback['feedback']['improvements'] ?? []),
                    sourceType: self::SOURCE_SPEAKING_PART,
                    sourceId: $part->id,
                    part: (int) $part->part,
                    displayOrder: (int) $part->display_order,
                );
            })
            ->all();
    }

    /**
     * @param  list<string>  $selectedSkills
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array<string, mixed>>  $sections
     * @return list<array<string, mixed>>
     */
    private function skillRows(array $selectedSkills, array $scores, array $sections): array
    {
        $labels = ['listening' => 'Nghe', 'reading' => 'Đọc', 'writing' => 'Viết', 'speaking' => 'Nói'];
        $orderedSkills = ['listening', 'reading', 'writing', 'speaking'];
        $rows = [];

        foreach ($orderedSkills as $skill) {
            if (! in_array($skill, $selectedSkills, true)) {
                continue;
            }
            $skillSections = array_values(array_filter($sections, fn (array $section): bool => $section['skill'] === $skill));
            $score = $this->skillScoreLabel($skill, $scores[$skill] ?? null, $skillSections);
            $rows[] = [
                'key' => $skill,
                'label' => $labels[$skill],
                'status' => $score['status'],
                'status_label' => $this->formatter->statusLabel($score['status']),
                'score_label' => $score['label'],
                'issue_count' => array_sum(array_map(fn (array $section): int => (int) $section['issue_count'], $skillSections)),
                'section_ids' => array_map(fn (array $section): string => (string) $section['id'], $skillSections),
            ];
        }

        return $rows;
    }

    /** @param  list<array<string, mixed>>  $sections */
    private function skillScoreLabel(string $skill, ?float $band, array $sections): array
    {
        if ($skill === 'listening' || $skill === 'reading') {
            $correct = 0;
            $total = 0;
            foreach ($sections as $section) {
                [$sectionCorrect, $sectionTotal] = array_map('intval', explode('/', (string) $section['score_label']));
                $correct += $sectionCorrect;
                $total += $sectionTotal;
            }

            return ['label' => "{$correct}/{$total}", 'status' => ExamResultReadModelStatus::READY];
        }

        if ($band !== null) {
            return ['label' => 'Band '.round($band, 1), 'status' => ExamResultReadModelStatus::READY];
        }
        if (collect($sections)->contains(fn (array $section): bool => $section['status'] === ExamResultReadModelStatus::PENDING)) {
            return ['label' => $this->statusLabel(ExamResultReadModelStatus::PENDING), 'status' => ExamResultReadModelStatus::PENDING];
        }
        if (collect($sections)->contains(fn (array $section): bool => $section['status'] === ExamResultReadModelStatus::FAILED)) {
            return ['label' => $this->statusLabel(ExamResultReadModelStatus::FAILED), 'status' => ExamResultReadModelStatus::FAILED];
        }
        if (collect($sections)->contains(fn (array $section): bool => $section['status'] === ExamResultReadModelStatus::READY)) {
            return ['label' => 'Chưa đủ', 'status' => ExamResultReadModelStatus::PARTIAL];
        }

        return ['label' => $this->statusLabel(ExamResultReadModelStatus::NOT_SUBMITTED), 'status' => ExamResultReadModelStatus::NOT_SUBMITTED];
    }

    /** @param  Collection<int, mixed>  $items */
    private function scoreItems(string $itemRefType, Collection $items, Collection $mcqByItemId): array
    {
        $correct = 0;
        $issueCount = 0;
        foreach ($items as $item) {
            $detail = $mcqByItemId->get("{$itemRefType}:{$item->id}");
            if (($detail['is_correct'] ?? false) === true) {
                $correct++;
            } else {
                $issueCount++;
            }
        }

        return ['correct' => $correct, 'total' => $items->count(), 'issue_count' => $issueCount];
    }

    private function sectionStatus(?array $feedback): string
    {
        if ($feedback === null) {
            return ExamResultReadModelStatus::NOT_SUBMITTED;
        }
        if (($feedback['score_status'] ?? null) === ExamResultReadModelStatus::READY) {
            return ExamResultReadModelStatus::READY;
        }

        return (string) ($feedback['score_status'] ?? ExamResultReadModelStatus::PENDING);
    }

    private function statusLabel(string $status): string
    {
        return $this->formatter->statusLabel($status);
    }

    private function section(
        string $id,
        string $skill,
        string $label,
        string $shortLabel,
        string $scoreLabel,
        string $status,
        int $issueCount,
        string $sourceType,
        ?string $sourceId,
        int $part,
        int $displayOrder,
    ): array {
        return [
            'id' => $id,
            'skill' => $skill,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'part' => $part,
            'display_order' => $displayOrder,
            'label' => $label,
            'short_label' => $shortLabel,
            'score_label' => $scoreLabel,
            'status' => $status,
            'status_label' => $this->formatter->statusLabel($status),
            'issue_count' => $issueCount,
        ];
    }
}
