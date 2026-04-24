<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class StructuredGradingAgent implements Agent, HasStructuredOutput
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
        return 60;
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
            'rubric_scores' => $schema->object([
                'task_achievement' => $schema->number(),
                'coherence' => $schema->number(),
                'lexical' => $schema->number(),
                'grammar' => $schema->number(),
            ])->withoutAdditionalProperties(),
            'overall_band' => $schema->number(),
            'strengths' => $schema->array()->items($schema->string()),
            'improvements' => $schema->array()->items(
                $schema->object([
                    'message' => $schema->string(),
                    'explanation' => $schema->string(),
                ])->withoutAdditionalProperties()
            ),
            'rewrites' => $schema->array()->items(
                $schema->object([
                    'original' => $schema->string(),
                    'improved' => $schema->string(),
                    'reason' => $schema->string(),
                ])->withoutAdditionalProperties()
            ),
            'annotations' => $schema->array()->items($schema->string()),
        ];
    }
}
