<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

/**
 * Single agent that both grades the user turn AND generates the AI reply.
 * Halves the number of LLM calls per turn (avoids 429 rate limits).
 */
class ConversationTurnAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function provider(): string
    {
        return 'bifrost';
    }

    public function model(): string
    {
        return (string) config('ai.providers.bifrost.models.text.conversation', 'Packyapi/gpt-5.4-mini');
    }

    public function timeout(): int
    {
        return 30;
    }

    public function instructions(): string
    {
        return '';
    }

    public function messages(): iterable
    {
        return [];
    }

    public function tools(): iterable
    {
        return [];
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'feedback' => $schema->object([
                'word_count' => $schema->object([
                    'used' => $schema->integer(),
                    'target' => $schema->integer(),
                ])->withoutAdditionalProperties(),
                'grammar_ok' => $schema->boolean(),
                'grammar_corrections' => $schema->array()->items(
                    $schema->object([
                        'wrong' => $schema->string(),
                        'correct' => $schema->string(),
                        'explanation' => $schema->string(),
                    ])->withoutAdditionalProperties()
                ),
                'vocab_check' => $schema->array()->items(
                    $schema->object([
                        'phrase' => $schema->string(),
                        'used' => $schema->boolean(),
                    ])->withoutAdditionalProperties()
                ),
                'better' => $schema->string(),
                'user_ipa' => $schema->string(),
                'better_ipa' => $schema->string(),
            ])->withoutAdditionalProperties(),
            'reply' => $schema->string(),
            'reply_ipa' => $schema->string(),
            'suggested_words' => $schema->array()->items($schema->string()),
        ];
    }
}
