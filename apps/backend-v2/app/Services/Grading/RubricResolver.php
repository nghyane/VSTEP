<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Models\GradingRubric;

/**
 * Resolves the active rubric for a given skill.
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
            ->first();

        if ($rubric === null) {
            throw new \RuntimeException(
                "No active grading rubric for skill '{$skill}'. Run the rubric seeder."
            );
        }

        $this->cache[$skill] = $rubric;

        return $rubric;
    }
}
