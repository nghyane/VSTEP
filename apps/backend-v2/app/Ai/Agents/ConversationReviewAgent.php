<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

/**
 * Analyzes a completed conversation and provides overall feedback.
 */
class ConversationReviewAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    public function provider(): string
    {
        return 'workers-ai';
    }

    public function model(): string
    {
        return (string) config('ai.providers.workers-ai.models.text.default', '@cf/meta/llama-4-scout-17b-16e-instruct');
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
            'strengths' => $schema->array()->items($schema->string()),
            'improvements' => $schema->array()->items($schema->string()),
            'corrected_sentences' => $schema->array()->items(
                $schema->object([
                    'original' => $schema->string(),
                    'corrected' => $schema->string(),
                    'explanation' => $schema->string(),
                ])->withoutAdditionalProperties()
            ),
            'tip' => $schema->string(),
        ];
    }
}
