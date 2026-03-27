<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Skill;
use App\Models\KnowledgePoint;
use App\Models\Submission;
use App\Models\UserWeakPoint;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WeakPointService
{
    /**
     * Record knowledge gaps from a graded submission.
     * New gaps → create weak points. Existing gaps → reset schedule.
     * KPs covered by question but NOT in gaps → progress (learner improved).
     */
    private const SCORE_PASS_THRESHOLD = 5.0;

    private const SCORE_QUALITY_MAP = [
        8.0 => 5,
        6.5 => 4,
    ];

    public function recordFromSubmission(Submission $submission): void
    {
        DB::transaction(function () use ($submission) {
            $gaps = $submission->result['knowledge_gaps'] ?? [];
            $gapNames = collect($gaps)->pluck('name')->toArray();
            $gapKpIds = KnowledgePoint::whereIn('name', $gapNames)->pluck('id')->toArray();

            foreach ($gapKpIds as $kpId) {
                $wp = UserWeakPoint::firstOrCreate(
                    ['user_id' => $submission->user_id, 'knowledge_point_id' => $kpId, 'skill' => $submission->skill],
                    ['next_review_at' => now(), 'ease_factor' => 2.5],
                );

                if (! $wp->wasRecentlyCreated) {
                    $wp->update([
                        'repetition_count' => 0,
                        'interval_days' => 1,
                        'next_review_at' => now(),
                        'is_mastered' => false,
                    ]);
                }
            }

            if ($submission->score !== null && $submission->score >= self::SCORE_PASS_THRESHOLD) {
                $submission->loadMissing('question.knowledgePoints');
                $questionKpIds = $submission->question?->knowledgePoints->pluck('id')->toArray() ?? [];
                $improvedKpIds = array_diff($questionKpIds, $gapKpIds);

                if (! empty($improvedKpIds)) {
                    $quality = $this->mapScoreToQuality($submission->score);

                    UserWeakPoint::forUser($submission->user_id)
                        ->where('skill', $submission->skill)
                        ->where('is_mastered', false)
                        ->whereIn('knowledge_point_id', $improvedKpIds)
                        ->get()
                        ->each(fn (UserWeakPoint $wp) => $this->updateAfterPractice($wp, $quality));
                }
            }
        });
    }

    private function mapScoreToQuality(float $score): int
    {
        foreach (self::SCORE_QUALITY_MAP as $threshold => $quality) {
            if ($score >= $threshold) {
                return $quality;
            }
        }

        return 3;
    }

    /**
     * Update weak point after successful practice (SM-2 algorithm).
     *
     * @param  int  $quality  0-5 scale (0=complete fail, 5=perfect)
     */
    public function updateAfterPractice(UserWeakPoint $wp, int $quality): void
    {
        if ($quality >= 3) {
            // Successful recall
            $wp->repetition_count++;

            $wp->interval_days = match ($wp->repetition_count) {
                1 => 1,
                2 => 3,
                default => (int) round($wp->interval_days * $wp->ease_factor),
            };

            $wp->ease_factor = max(1.3, $wp->ease_factor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02)));

            if ($wp->repetition_count >= 5 && $wp->ease_factor >= 2.0) {
                $wp->is_mastered = true;
            }
        } else {
            // Failed — reset
            $wp->repetition_count = 0;
            $wp->interval_days = 1;
        }

        $wp->last_practiced_at = now();
        $wp->next_review_at = now()->addDays($wp->interval_days);
        $wp->save();
    }

    /**
     * Get weak points due for review.
     */
    public function getDueForReview(string $userId, Skill $skill, int $limit = 5): Collection
    {
        return UserWeakPoint::with('knowledgePoint')
            ->forUser($userId)
            ->where('skill', $skill)
            ->dueForReview()
            ->orderBy('next_review_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Detect recurring error patterns from recent submissions.
     */
    public function detectPatterns(string $userId, Skill $skill): array
    {
        return Submission::forUser($userId)
            ->where('skill', $skill)
            ->whereNotNull('result')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->pluck('result.knowledge_gaps')
            ->filter()
            ->flatten(1)
            ->pluck('name')
            ->countBy()
            ->sortDesc()
            ->take(5)
            ->toArray();
    }

    /**
     * Get practice recommendation based on weak points and patterns.
     */
    public function getRecommendation(string $userId, Skill $skill): array
    {
        $totalSubmissions = Submission::forUser($userId)->where('skill', $skill)->count();
        $dueCount = UserWeakPoint::forUser($userId)
            ->where('skill', $skill)
            ->dueForReview()
            ->count();

        $patterns = $this->detectPatterns($userId, $skill);
        $topWeakness = array_key_first($patterns);

        return [
            'is_first_time' => $totalSubmissions === 0,
            'review_due' => $dueCount,
            'top_patterns' => $patterns,
            'suggested_focus' => $topWeakness,
        ];
    }
}
