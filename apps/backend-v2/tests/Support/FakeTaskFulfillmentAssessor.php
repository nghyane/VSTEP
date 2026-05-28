<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\TaskFulfillmentAssessor;

final class FakeTaskFulfillmentAssessor implements TaskFulfillmentAssessor
{
    public function assess(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis, int $part = 2): array
    {
        return [
            'points_covered' => 3,
            'points_required' => 3,
            'has_clear_position' => true,
            'has_irrelevant_content' => false,
        ];
    }
}
