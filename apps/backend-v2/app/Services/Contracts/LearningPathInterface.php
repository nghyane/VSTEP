<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\Profile;

/**
 * Read-only aggregate of learner progress across all skills at their current level.
 *
 * Returns a structured learning path snapshot: where the learner is,
 * what they've completed, and what to focus on next.
 * No DB writes — pure query aggregation.
 */
interface LearningPathInterface
{
    /**
     * Build a learning path snapshot for the given profile.
     *
     * @return array{
     *     current_level: string,
     *     target_level: string,
     *     days_remaining: int|null,
     *     skills: list<array{
     *         skill: string,
     *         level: string,
     *         band: float|null,
     *         coverage_pct: int|null,
     *         total_items: int|null,
     *         completed_items: int|null,
     *         suggestion: ?string,
     *     }>,
     * }
     */
    public function forProfile(Profile $profile): array;
}
