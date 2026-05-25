<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Agents\ConversationReviewAgent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Responses\AgentResponse;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\StructuredAgentResponse;
use Laravel\Ai\Responses\TextResponse;

/**
 * Fake ConversationReviewAgent for testing — bypasses real LLM.
 */
final class FakeConversationReviewAgent extends ConversationReviewAgent
{
    public function prompt(
        string $prompt,
        array $attachments = [],
        Lab|array|string|null $provider = null,
        ?string $model = null,
        ?int $timeout = null,
    ): AgentResponse {
        return new StructuredAgentResponse(
            structured: [
                'strengths' => ['Good vocabulary usage'],
                'improvements' => ['Work on pronunciation'],
                'corrected_sentences' => [],
                'tip' => 'Keep practicing!',
            ],
            rawResponse: new TextResponse(
                '{}',
                new Usage(10, 20),
                new Meta('fake', 'fake-model'),
            ),
        );
    }
}
