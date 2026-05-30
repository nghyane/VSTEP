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

        return [
            'listening' => $this->mcqBandFromCollection($mcqAnswers, 'exam_listening_item'),
            'reading' => $this->mcqBandFromCollection($mcqAnswers, 'exam_reading_item'),
            'writing' => $this->writingComposite($session),
            'speaking' => $this->speakingBand($session),
        ];
    }

    /**
     * Compute MCQ band from a pre-loaded collection, filtered by item_ref_type.
     */
    private function mcqBandFromCollection(Collection $answers, string $itemRefType): ?float
    {
        $filtered = $answers->where('item_ref_type', $itemRefType);

        if ($filtered->isEmpty()) {
            return null;
        }

        $correct = $filtered->where('is_correct', true)->count();

        return round($correct / $filtered->count() * 10, 1);
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
        $rows = ExamWritingSubmission::query()
            ->with(['task:id,part', 'assessmentAttempt.result'])
            ->where('exam_writing_submissions.session_id', $session->id)
            ->get();

        $task1 = $rows->first(fn (ExamWritingSubmission $submission): bool => $submission->task?->part === 1);
        $task2 = $rows->first(fn (ExamWritingSubmission $submission): bool => $submission->task?->part === 2);

        $task1Band = $task1?->assessmentAttempt?->result?->overall_band;
        $task2Band = $task2?->assessmentAttempt?->result?->overall_band;

        if ($task1Band === null || $task2Band === null) {
            return null;
        }

        $composite = ((float) $task1Band + 2 * (float) $task2Band) / 3;

        return round($composite * 2) / 2;
    }

    private function speakingBand(ExamSession $session): ?float
    {
        $bands = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $session->id)
            ->get()
            ->map(fn (ExamSpeakingSubmission $submission): ?float => $submission->assessmentAttempt?->result?->overall_band)
            ->filter(fn (?float $band): bool => $band !== null);

        return $bands->isNotEmpty() ? round((float) $bands->avg(), 1) : null;
    }
}
