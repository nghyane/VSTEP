<?php

declare(strict_types=1);

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SubmitWritingGrade implements Tool
{
    private ?array $result = null;

    public function description(): Stringable|string
    {
        return 'Submit the final writing grade. You MUST call this tool exactly once with your assessment results.';
    }

    public function handle(Request $request): Stringable|string
    {
        $this->result = [
            'criteria_scores' => [
                'task_fulfillment' => (float) $request['task_fulfillment'],
                'organization' => (float) $request['organization'],
                'vocabulary' => (float) $request['vocabulary'],
                'grammar' => (float) $request['grammar'],
            ],
            'feedback' => (string) $request['feedback'],
            'knowledge_gaps' => (array) $request['knowledge_gaps'],
            'confidence' => (string) $request['confidence'],
        ];

        return 'Grade submitted successfully.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'task_fulfillment' => $schema->number()->min(0)->max(10)->required(),
            'organization' => $schema->number()->min(0)->max(10)->required(),
            'vocabulary' => $schema->number()->min(0)->max(10)->required(),
            'grammar' => $schema->number()->min(0)->max(10)->required(),
            'feedback' => $schema->string()->required(),
            'knowledge_gaps' => $schema->array()->items($schema->string())->required(),
            'confidence' => $schema->string()->required(),
        ];
    }

    public function getResult(): ?array
    {
        return $this->result;
    }
}
