<?php

declare(strict_types=1);

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class SubmitContent implements Tool
{
    private ?array $result = null;

    public function description(): Stringable|string
    {
        return 'Submit generated content as a JSON string. The JSON must be an array of objects.';
    }

    public function handle(Request $request): Stringable|string
    {
        $json = (string) $request['content_json'];
        $parsed = json_decode($json, true);

        if (! is_array($parsed) || empty($parsed)) {
            return 'Error: Invalid JSON. Please provide a valid JSON array of objects.';
        }

        $this->result = $parsed;

        return 'Content submitted successfully. Count: '.count($parsed);
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'content_json' => $schema->string()
                ->description('JSON array of content objects')
                ->required(),
        ];
    }

    public function getResult(): ?array
    {
        return $this->result;
    }
}
