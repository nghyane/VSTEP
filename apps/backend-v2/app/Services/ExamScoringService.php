<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use Illuminate\Support\Collection;

final class ExamScoringService
{
    /**
     * Load MCQ item answer map for a session.
     * Uses eager-loaded relations when available to avoid duplicate queries.
     *
     * @return array<string,int> key = "type:id", value = correct_index
     */
    public function loadMcqItemMap(ExamSession $session): array
    {
        $version = $session->examVersion;
        $version->loadMissing(['listeningSections.items', 'readingPassages.items']);
        $map = [];
        foreach ($version->listeningSections as $section) {
            foreach ($section->items as $item) {
                $map["exam_listening_item:{$item->id}"] = $item->correct_index;
            }
        }
        foreach ($version->readingPassages as $passage) {
            foreach ($passage->items as $item) {
                $map["exam_reading_item:{$item->id}"] = $item->correct_index;
            }
        }

        return $map;
    }

    /**
     * Compute per-skill band scores for a graded exam session.
     *
     * Listening/Reading: MCQ correct ratio → band 0-10.
     * Writing: (Task1 + 2×Task2)/3 weighted composite (VNU Journal of Foreign Studies, 2018).
     * Speaking: avg overall_band from assessment results.
     *
     * @return array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}
     */
    public function getSessionScores(ExamSession $session): array
    {
        $mcqAnswers = $session->relationLoaded('mcqAnswers')
            ? $session->mcqAnswers
            : ExamMcqAnswer::query()->where('session_id', $session->id)->get(['is_correct', 'item_ref_type']);
        $itemMap = $this->loadMcqItemMap($session);
        $skills = $session->selected_skills ?? [];

        return [
            'listening' => in_array('listening', $skills, true)
                ? $this->mcqBandFromCollection($mcqAnswers, 'exam_listening_item', $this->countMcqItems($itemMap, 'exam_listening_item'))
                : null,
            'reading' => in_array('reading', $skills, true)
                ? $this->mcqBandFromCollection($mcqAnswers, 'exam_reading_item', $this->countMcqItems($itemMap, 'exam_reading_item'))
                : null,
            'writing' => in_array('writing', $skills, true) ? $this->writingComposite($session) : null,
            'speaking' => in_array('speaking', $skills, true) ? $this->speakingBand($session) : null,
        ];
    }

    /**
     * Compute MCQ band from a pre-loaded collection, filtered by item_ref_type.
     * Unanswered items stay in the denominator, matching submit() scoring.
     */
    private function mcqBandFromCollection(Collection $answers, string $itemRefType, int $total): ?float
    {
        if ($total <= 0) {
            return null;
        }

        $correct = $answers
            ->where('item_ref_type', $itemRefType)
            ->where('is_correct', true)
            ->count();

        return round($correct / $total * 10, 1);
    }

    /** @param array<string,int> $itemMap */
    private function countMcqItems(array $itemMap, string $itemRefType): int
    {
        $prefix = "{$itemRefType}:";

        return count(array_filter(array_keys($itemMap), fn (string $key) => str_starts_with($key, $prefix)));
    }

    /**
     * Compute VSTEP overall band from 4 skill scores.
     *
     * Formula: round((listening + reading + writing + speaking) / 4, 0.5)
     * per Thông tư 23/2017/TT-BGDĐT.
     *
     * Returns null if any skill score is null (not yet graded).
     *
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     */
    public function getOverallBand(array $scores): ?float
    {
        $values = array_filter(
            [$scores['listening'] ?? null, $scores['reading'] ?? null, $scores['writing'] ?? null, $scores['speaking'] ?? null],
            fn ($v) => $v !== null,
        );

        if (count($values) < 4) {
            return null;
        }

        $mean = array_sum($values) / 4;

        return round($mean * 2) / 2;
    }

    /**
     * Map VSTEP bậc 3-5 overall band to the achieved proficiency band.
     *
     * @return string 'C1' | 'B2' | 'B1' | 'Không đạt'
     */
    public function bandToVstepLevel(?float $band): string
    {
        if ($band === null) {
            return 'Chưa có điểm';
        }

        if ($band >= 8.5) {
            return 'C1';
        }
        if ($band >= 6.0) {
            return 'B2';
        }
        if ($band >= 4.0) {
            return 'B1';
        }

        return 'Không đạt';
    }

    /**
     * VSTEP Writing composite: (Task1 + 2×Task2)/3, rounded to 0.5.
     *
     * Source: VNU Journal of Foreign Studies, Vol.34, No.4 (2018) —
     * ULIS-VNU scoring validity study.
     *
     * Returns null if either task is ungraded.
     */
    private function writingComposite(ExamSession $session): ?float
    {
        $tasks = $session->examVersion->writingTasks()->orderBy('part')->get(['id', 'part']);
        if ($tasks->isEmpty()) {
            return null;
        }

        $rows = ExamWritingSubmission::query()
            ->with(['task:id,part', 'assessmentAttempt.result'])
            ->where('exam_writing_submissions.session_id', $session->id)
            ->get();

        $rowsByTaskId = $rows->keyBy('task_id');
        $bandsByPart = [];
        foreach ($tasks as $task) {
            /** @var ExamWritingSubmission|null $submission */
            $submission = $rowsByTaskId->get($task->id);
            $band = $this->writingTaskBand($submission);
            if ($band === null) {
                return null;
            }
            $bandsByPart[(int) $task->part] = $band;
        }

        if (array_key_exists(1, $bandsByPart) && array_key_exists(2, $bandsByPart)) {
            $composite = ($bandsByPart[1] + 2 * $bandsByPart[2]) / 3;

            return round($composite * 2) / 2;
        }

        $composite = array_sum($bandsByPart) / count($bandsByPart);

        return round($composite * 2) / 2;
    }

    private function writingTaskBand(?ExamWritingSubmission $submission): ?float
    {
        if ($submission === null || trim($submission->text) === '') {
            return 0.0;
        }

        $band = $submission->assessmentAttempt?->result?->overall_band;

        return $band === null ? null : (float) $band;
    }

    private function speakingBand(ExamSession $session): ?float
    {
        $parts = $session->examVersion->speakingParts()->orderBy('part')->get(['id', 'part']);
        if ($parts->isEmpty()) {
            return null;
        }

        $submissions = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $session->id)
            ->get()
            ->keyBy('part_id');

        $bands = [];
        foreach ($parts as $part) {
            /** @var ExamSpeakingSubmission|null $submission */
            $submission = $submissions->get($part->id);
            if ($submission === null) {
                $bands[] = 0.0;

                continue;
            }

            $band = $submission->assessmentAttempt?->result?->overall_band;
            if ($band === null) {
                return null;
            }
            $bands[] = (float) $band;
        }

        return round(array_sum($bands) / count($bands), 1);
    }
}
