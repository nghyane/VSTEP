<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Agents\ConversationTurnAgent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\StructuredAgentResponse;
use Laravel\Ai\Responses\TextResponse;

/**
 * Fake ConversationTurnAgent for testing — bypasses real LLM.
 */
final class FakeConversationTurnAgent extends ConversationTurnAgent
{
    public function prompt(
        string $prompt,
        array $attachments = [],
        Lab|array|string|null $provider = null,
        ?string $model = null,
        ?int $timeout = null,
    ): AgentResponse {
        $structured = [
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

        return new StructuredAgentResponse(
            structured: $structured,
            rawResponse: new TextResponse(
                json_encode($structured),
                new Usage(10, 20),
                new Meta('fake', 'fake-model'),
            ),
        );
    }
}
