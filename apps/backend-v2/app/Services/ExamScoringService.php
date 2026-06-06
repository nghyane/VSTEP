<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use Illuminate\Support\Collection;

final class ExamScoringService
{
    private const SCORE_MAX = 10.0;

    private const SCORE_STEP = 0.5;

    private const FULL_TEST_SKILLS = ['listening', 'reading', 'writing', 'speaking'];

    private const SKILL_LABELS = [
        'listening' => 'Nghe',
        'reading' => 'Đọc',
        'writing' => 'Viết',
        'speaking' => 'Nói',
    ];

    private const STATUS_READY = 'ready';

    private const STATUS_PENDING = 'pending';

    private const STATUS_NOT_APPLICABLE = 'not_applicable';

    private const STATUS_NOT_SUBMITTED = 'not_submitted';

    private const STATUS_FAILED = 'failed';

    private const OVERALL_NOT_APPLICABLE_REASON = 'Bài thi chưa đủ 4 kỹ năng để xếp bậc VSTEP tham khảo.';

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
     * Listening/Reading: MCQ correct ratio → score 0-10 rounded to 0.5.
     * Writing: (Task1 + 2×Task2)/3 per Quyết định 729/QĐ-BGDĐT.
     * Speaking: avg overall_band from assessment results rounded to 0.5.
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

        return $this->roundToHalf($correct / $total * self::SCORE_MAX);
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
     * per Quyết định 729/QĐ-BGDĐT for VSTEP 3-5.
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

        return $this->roundToHalf($mean);
    }

    public function roundToHalf(float $score): float
    {
        $clamped = max(0.0, min(self::SCORE_MAX, $score));

        return round($clamped / self::SCORE_STEP) * self::SCORE_STEP;
    }

    /** @return array<string, mixed> */
    public function scoringRules(): array
    {
        return [
            'scheme' => 'vstep_3_5',
            'name' => 'VSTEP bậc 3-5',
            'skill_scale' => [
                'min' => 0.0,
                'max' => self::SCORE_MAX,
                'step' => self::SCORE_STEP,
                'rounding' => 'nearest_half',
            ],
            'overall' => [
                'required_skills' => self::FULL_TEST_SKILLS,
                'formula' => 'round_to_nearest_0.5((listening + reading + writing + speaking) / 4)',
            ],
            'levels' => [
                ['code' => null, 'label' => 'Không xét', 'vietnamese_level' => null, 'min_score' => 0.0, 'max_score' => 3.5],
                ['code' => 'B1', 'label' => 'B1', 'vietnamese_level' => 3, 'min_score' => 4.0, 'max_score' => 5.5],
                ['code' => 'B2', 'label' => 'B2', 'vietnamese_level' => 4, 'min_score' => 6.0, 'max_score' => 8.0],
                ['code' => 'C1', 'label' => 'C1', 'vietnamese_level' => 5, 'min_score' => 8.5, 'max_score' => 10.0],
            ],
            'sources' => [
                [
                    'title' => 'Quyết định 729/QĐ-BGDĐT ngày 11/03/2015 về định dạng đề thi đánh giá năng lực sử dụng tiếng Anh từ bậc 3 đến bậc 5',
                    'issuer' => 'Bộ Giáo dục và Đào tạo',
                    'url' => null,
                ],
                [
                    'title' => 'Thông tư 23/2017/TT-BGDĐT ban hành Quy chế thi đánh giá năng lực ngoại ngữ theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam',
                    'issuer' => 'Bộ Giáo dục và Đào tạo',
                    'url' => 'https://vqa.moet.gov.vn/vi/laws/detail/Thong-tu-Ban-hanh-Quy-che-thi-danh-gia-nang-luc-ngoai-ngu-theo-Khung-nang-luc-ngoai-ngu-6-bac-dung-cho-Viet-Nam-30/',
                ],
            ],
        ];
    }

    public function overallApplicable(ExamSession $session): bool
    {
        $skills = $session->selected_skills ?? [];

        foreach (self::FULL_TEST_SKILLS as $skill) {
            if (! in_array($skill, $skills, true)) {
                return false;
            }
        }

        return true;
    }

    public function overallNotApplicableReason(): string
    {
        return self::OVERALL_NOT_APPLICABLE_REASON;
    }

    /**
     * Lightweight canonical score summary used by exam overview/history.
     *
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}|null  $scores
     * @return array<string, mixed>
     */
    public function sessionScoreSummary(ExamSession $session, ?array $scores = null): array
    {
        $scores ??= $this->getSessionScores($session);
        $overallApplicable = $this->overallApplicable($session);
        $overallBand = $overallApplicable ? $this->getOverallBand($scores) : null;
        $level = $overallBand === null ? null : $this->levelForBand($overallBand);

        return [
            'score_status' => $this->scoreStatus($session, $scores, $overallApplicable, $overallBand),
            'scoring' => $this->scoringRules(),
            'overall' => [
                'applicable' => $overallApplicable,
                'reason' => $overallApplicable ? null : self::OVERALL_NOT_APPLICABLE_REASON,
                'band' => $overallBand,
                'score_on_10' => $overallBand,
                'max_score' => self::SCORE_MAX,
                'vstep_level' => $overallBand === null ? null : $this->bandToVstepLevel($overallBand),
                'level' => $level,
                'result_label' => $overallBand === null ? null : ($level['label'] ?? 'Không xét'),
            ],
            'skills' => $this->skillScoreSummaries($session, $scores, $overallApplicable),
        ];
    }

    /**
     * Map VSTEP bậc 3-5 overall band to the achieved proficiency band.
     *
     * @return string 'C1' | 'B2' | 'B1' | 'Không xét' | 'Chưa có điểm'
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

        return 'Không xét';
    }

    /** @return array<string, mixed>|null */
    public function levelForBand(float $band): ?array
    {
        if ($band >= 8.5) {
            return ['code' => 'C1', 'label' => 'C1', 'vietnamese_level' => 5, 'min_score' => 8.5, 'max_score' => 10.0];
        }
        if ($band >= 6.0) {
            return ['code' => 'B2', 'label' => 'B2', 'vietnamese_level' => 4, 'min_score' => 6.0, 'max_score' => 8.0];
        }
        if ($band >= 4.0) {
            return ['code' => 'B1', 'label' => 'B1', 'vietnamese_level' => 3, 'min_score' => 4.0, 'max_score' => 5.5];
        }

        return null;
    }

    /**
     * VSTEP Writing composite: (Task1 + 2×Task2)/3, rounded to 0.5.
     *
     * Source: Quyết định 729/QĐ-BGDĐT — Task 1 chiếm 1/3, Task 2 chiếm 2/3.
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

            return $this->roundToHalf($composite);
        }

        $composite = array_sum($bandsByPart) / count($bandsByPart);

        return $this->roundToHalf($composite);
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

        return $this->roundToHalf(array_sum($bands) / count($bands));
    }

    /**
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @return list<array<string, mixed>>
     */
    private function skillScoreSummaries(ExamSession $session, array $scores, bool $overallApplicable): array
    {
        $selectedSkills = $session->selected_skills ?? [];
        $rows = [];

        foreach (self::FULL_TEST_SKILLS as $skill) {
            if (! in_array($skill, $selectedSkills, true)) {
                continue;
            }

            $score = $scores[$skill] ?? null;
            $rows[] = [
                'key' => $skill,
                'label' => self::SKILL_LABELS[$skill],
                'status' => $this->skillScoreStatus($session, $skill, $score),
                'score_on_10' => $score,
                'max_score' => self::SCORE_MAX,
                'weight_percent' => 25,
                'contributes_to_overall' => $overallApplicable,
            ];
        }

        return $rows;
    }

    /** @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores */
    private function scoreStatus(ExamSession $session, array $scores, bool $overallApplicable, ?float $overallBand): string
    {
        if (! $session->status->isTerminal()) {
            return self::STATUS_NOT_SUBMITTED;
        }
        if (! $overallApplicable) {
            return self::STATUS_NOT_APPLICABLE;
        }
        if ($overallBand !== null) {
            return self::STATUS_READY;
        }
        if ($this->hasFailedAssessmentJobs($session)) {
            return self::STATUS_FAILED;
        }

        return in_array(null, array_values($scores), true) ? self::STATUS_PENDING : self::STATUS_NOT_SUBMITTED;
    }

    private function hasFailedAssessmentJobs(ExamSession $session): bool
    {
        return $this->hasFailedAssessmentJobsForSkill($session, 'writing')
            || $this->hasFailedAssessmentJobsForSkill($session, 'speaking');
    }

    private function skillScoreStatus(ExamSession $session, string $skill, ?float $score): string
    {
        if ($score !== null) {
            return self::STATUS_READY;
        }
        if ($skill === 'listening' || $skill === 'reading') {
            return self::STATUS_NOT_SUBMITTED;
        }
        if ($this->hasFailedAssessmentJobsForSkill($session, $skill)) {
            return self::STATUS_FAILED;
        }

        return self::STATUS_PENDING;
    }

    private function hasFailedAssessmentJobsForSkill(ExamSession $session, string $skill): bool
    {
        $skills = $session->selected_skills ?? [];
        if (! in_array($skill, $skills, true)) {
            return false;
        }

        return match ($skill) {
            'writing' => ExamWritingSubmission::query()
                ->where('session_id', $session->id)
                ->whereHas('assessmentAttempt.job', fn ($query) => $query->where('status', AssessmentJobStatus::Failed->value))
                ->exists(),
            'speaking' => ExamSpeakingSubmission::query()
                ->where('session_id', $session->id)
                ->whereHas('assessmentAttempt.job', fn ($query) => $query->where('status', AssessmentJobStatus::Failed->value))
                ->exists(),
            default => false,
        };
    }
}
