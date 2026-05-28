<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\ContentRelevanceAssessor;

final class FakeContentRelevanceAssessor implements ContentRelevanceAssessor
{
    public function assess(string $transcript, string $prompt, array $requirements): float
    {
        return 1.0;
    }
}
