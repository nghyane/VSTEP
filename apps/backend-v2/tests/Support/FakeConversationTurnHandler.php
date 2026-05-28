<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\ConversationTurnHandler;

final class FakeConversationTurnHandler implements ConversationTurnHandler
{
    public function gradeAndReply(string $character, string $systemPrompt, string $level, string $history, string $userText, array $vocabToCheck): array
    {
        return [
            'feedback' => [
                'word_count' => ['used' => 1, 'target' => 2],
                'grammar_ok' => true,
                'grammar_corrections' => [],
                'vocab_check' => [],
                'better' => 'Hello, how are you?',
                'user_ipa' => 'hɛˈloʊ',
                'better_ipa' => 'hɛˈloʊ, haʊ ɑːr juː',
            ],
            'reply' => "I'm doing great, thank you! How about you?",
            'reply_ipa' => 'aɪm ˈduɪŋ ɡreɪt, θæŋk juː',
            'suggested_words' => ['I am fine', 'Not bad'],
        ];
    }
}
