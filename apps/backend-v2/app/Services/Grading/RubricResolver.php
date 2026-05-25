<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;
use App\Models\ScoringPolicy;

/**
 * Resolves the active rubric + scoring policy for a given skill.
 *
 * Registered as scoped singleton (reset per request) to avoid
 * repeated DB lookups when multiple strategies need the same rubric.
 */
final class RubricResolver
{
    /** @var array<string, GradingRubric> */
    private array $cache = [];

    public function active(string $skill): GradingRubric
    {
        if (isset($this->cache[$skill])) {
            return $this->cache[$skill];
        }

        $rubric = GradingRubric::query()
            ->where('skill', $skill)
            ->where('is_active', true)
            ->with('activePolicy')
            ->first();

        if ($rubric === null) {
            throw new \RuntimeException(
                "No active grading rubric for skill '{$skill}'. Run the rubric seeder."
            );
        }

        $this->cache[$skill] = $rubric;

        return $rubric;
    }

    public function activePolicy(string $skill): ScoringPolicy
    {
        $policy = $this->active($skill)->activePolicy;

        if ($policy === null) {
            throw new \RuntimeException(
                "No active scoring policy for skill '{$skill}'. Run the rubric seeder."
            );
        }

        return $policy;
    }
}
