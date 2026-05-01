<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class ConversationReplyAgent implements Agent, HasStructuredOutput
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
            'text' => $schema->string(),
            'suggested_words' => $schema->array()->items($schema->string()),
        ];
    }
}
