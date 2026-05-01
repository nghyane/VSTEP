<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class ConversationGradingAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function provider(): string
    {
        return 'llm';
    }

    public function model(): string
    {
        return (string) config('ai.providers.llm.models.text.default', 'openai/gpt-5.4-mini');
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
            'word_count' => $schema->object([
                'used' => $schema->integer(),
                'target' => $schema->integer(),
            ])->withoutAdditionalProperties(),
            'grammar_ok' => $schema->boolean(),
            'vocab_check' => $schema->array()->items(
                $schema->object([
                    'phrase' => $schema->string(),
                    'used' => $schema->boolean(),
                ])->withoutAdditionalProperties()
            ),
            'better' => $schema->string(),
        ];
    }
}
