<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * OpenAI Responses API — POST /v1/responses
 * Structured output via tool calling (function calling) instead of
 * response_format: json_schema which has stricter schema validation.
 */
final class ResponsesWire implements WireFormat
{
    public function send(PendingRequest $http, WireRequest $request): WireResponse
    {
        $body = [
            'model' => $request->model,
            'input' => $this->buildInput($request),
        ];

        if ($request->thinking !== 'none') {
            $body['reasoning'] = ['effort' => $request->thinking];
        }

        if ($request->schema !== null) {
            $toolName = $request->toolName ?? 'structured_output';
            $body['tools'] = [$this->buildToolDefinition(
                $toolName,
                $request->toolDescription ?? 'Return structured data',
                $request->schema,
            )];
            $body['tool_choice'] = 'required';
        }

        if ($request->temperature !== null) {
            $body['temperature'] = $request->temperature;
        }

        $response = $http->timeout($request->timeout)->post('v1/responses', $body);
        $data = $response->json();

        $this->validateResponse($data);

        $structured = $request->schema !== null
            ? $this->extractToolArguments($data)
            : null;
        $text = $structured !== null
            ? json_encode($structured)
            : $this->extractText($data);

        return new WireResponse(
            text: $text,
            structured: $structured,
            usage: $this->extractUsage($data),
            model: $data['model'] ?? $request->model,
        );
    }

    private function buildInput(WireRequest $request): array
    {
        $input = [];

        if ($request->instructions !== null && $request->instructions !== '') {
            $input[] = ['role' => 'developer', 'content' => $request->instructions];
        }

        $input[] = ['role' => 'user', 'content' => $request->prompt];

        return $input;
    }

    /**
     * @param  array<string,mixed>  $parametersSchema
     * @return array<string,mixed>
     */
    private function buildToolDefinition(string $name, string $description, array $parametersSchema): array
    {
        return [
            'type' => 'function',
            'name' => $name,
            'description' => $description,
            'parameters' => [
                'type' => 'object',
                'properties' => $parametersSchema,
                'required' => array_keys($parametersSchema),
                'additionalProperties' => false,
            ],
            'strict' => true,
        ];
    }

    private function extractToolArguments(array $data): ?array
    {
        foreach ($data['output'] ?? [] as $output) {
            if (($output['type'] ?? '') === 'function_call') {
                $arguments = $output['arguments'] ?? null;
                if (is_string($arguments) && $arguments !== '') {
                    $decoded = json_decode($arguments, true);

                    return is_array($decoded) ? $decoded : null;
                }
            }
        }

        return null;
    }

    private function extractText(array $data): string
    {
        foreach ($data['output'] ?? [] as $output) {
            if (($output['type'] ?? '') !== 'message') {
                continue;
            }
            foreach ($output['content'] ?? [] as $content) {
                if (($content['type'] ?? '') === 'output_text') {
                    return $content['text'] ?? '';
                }
            }
        }

        return '';
    }

    private function validateResponse(mixed $data): void
    {
        if (! is_array($data) || isset($data['error'])) {
            throw new RuntimeException(sprintf(
                'OpenAI Responses API error: %s',
                $data['error']['message'] ?? 'Unknown error',
            ));
        }
    }

    private function extractUsage(array $data): array
    {
        return [
            'input_tokens' => (int) ($data['usage']['input_tokens'] ?? 0),
            'output_tokens' => (int) ($data['usage']['output_tokens'] ?? 0),
        ];
    }
}
