<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\WritingFeedbackGenerator;

final class FakeWritingFeedbackGenerator implements WritingFeedbackGenerator
{
    public function generate(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array
    {
        return [
            'strengths' => ['Tra loi dung yeu cau de bai'],
            'improvements' => ['Dung them tu noi'],
            'rewrites' => [],
        ];
    }
}
