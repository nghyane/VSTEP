<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
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
     * Speaking: avg overall_band from active grading results.
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
            'writing' => $this->writingComposite($session),
            'speaking' => $this->gradingBand('exam_speaking', 'exam_speaking_submissions', $session),
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
     * Map VSTEP band to CEFR level.
     *
     * @return string 'C1' | 'B2' | 'B1' | 'Không đạt'
     */
    public function bandToLevel(?float $band): string
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
        $rows = \DB::table('exam_writing_submissions')
            ->join('exam_version_writing_tasks', 'exam_writing_submissions.task_id', '=', 'exam_version_writing_tasks.id')
            ->join('writing_grading_results', function ($join) {
                $join->on('exam_writing_submissions.id', '=', 'writing_grading_results.submission_id')
                    ->where('writing_grading_results.submission_type', '=', 'exam_writing')
                    ->where('writing_grading_results.is_active', '=', true);
            })
            ->where('exam_writing_submissions.session_id', $session->id)
            ->select([
                'exam_version_writing_tasks.part',
                'writing_grading_results.overall_band',
            ])
            ->get();

        $task1 = $rows->where('part', 1)->first();
        $task2 = $rows->where('part', 2)->first();

        if ($task1 === null || $task2 === null) {
            return null;
        }

        $composite = ((float) $task1->overall_band + 2 * (float) $task2->overall_band) / 3;

        return round($composite * 2) / 2;
    }

    private function gradingBand(string $submissionType, string $submissionTable, ExamSession $session): ?float
    {
        $model = $submissionType === 'exam_writing'
            ? WritingGradingResult::class
            : SpeakingGradingResult::class;

        $band = $model::query()
            ->where('submission_type', $submissionType)
            ->whereIn('submission_id', function ($q) use ($submissionTable, $session) {
                $q->select('id')->from($submissionTable)->where('session_id', $session->id);
            })
            ->where('is_active', true)
            ->avg('overall_band');

        return $band !== null ? round((float) $band, 1) : null;
    }
}
