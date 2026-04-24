<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;

class ExamScoringService
{
    /**
     * Load MCQ item answer map for a session.
     *
     * @return array<string,int> key = "type:id", value = correct_index
     */
    public function loadMcqItemMap(ExamSession $session): array
    {
        $version = $session->examVersion;
        $version->load(['listeningSections.items', 'readingPassages.items']);
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
     * Listening/Reading: MCQ correct ratio → band 0-10 (phase 1: linear).
     * Writing/Speaking: avg overall_band from active grading results.
     *
     * @return array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}
     */
    public function getSessionScores(ExamSession $session): array
    {
        return [
            'listening' => $this->mcqBand($session, 'listening'),
            'reading' => $this->mcqBand($session, 'reading'),
            'writing' => $this->gradingBand('exam_writing', 'exam_writing_submissions', $session),
            'speaking' => $this->gradingBand('exam_speaking', 'exam_speaking_submissions', $session),
        ];
    }

    private function mcqBand(ExamSession $session, string $skill): ?float
    {
        $answers = ExamMcqAnswer::query()
            ->where('session_id', $session->id)
            ->where('item_ref_type', $skill)
            ->get(['is_correct']);

        if ($answers->isEmpty()) {
            return null;
        }

        $correct = $answers->where('is_correct', true)->count();

        return round($correct / $answers->count() * 10, 1);
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
