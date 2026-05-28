<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface ContentRelevanceAssessor
{
    /**
     * Assess how well the transcript content addresses the task prompt.
     *
     * @param  list<string>  $requirements
     * @return float 0.5–1.0 factor applied to discourse management score
     */
    public function assess(string $transcript, string $prompt, array $requirements): float;
}
