<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\ConversationReviewer;

final class FakeConversationReviewer implements ConversationReviewer
{
    public function review(string $title, string $level, string $history, string $userSentences): array
    {
        return [
            'strengths' => ['Good vocabulary usage'],
            'improvements' => ['Work on pronunciation'],
            'corrected_sentences' => [],
            'tip' => 'Keep practicing!',
        ];
    }
}
