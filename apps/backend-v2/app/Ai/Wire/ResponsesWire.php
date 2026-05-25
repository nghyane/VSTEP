<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * OpenAI Responses API — POST /v1/responses
 * Native structured output via json_schema.
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
            $body['text'] = [
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'structured_output',
                    'schema' => $this->buildSchema($request->schema),
                    'strict' => true,
                ],
            ];
        }

        if ($request->temperature !== null) {
            $body['temperature'] = $request->temperature;
        }

        $response = $http->timeout($request->timeout)->post('v1/responses', $body);
        $data = $response->json();

        $this->validateResponse($data);

        $text = $this->extractText($data);

        return new WireResponse(
            text: $text,
            structured: $request->schema !== null ? json_decode($text, true) : null,
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

    private function buildSchema(array $schema): array
    {
        return [
            'type' => 'object',
            'properties' => $schema,
            'required' => array_keys($schema),
            'additionalProperties' => false,
        ];
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

    private function extractText(array $data): string
    {
        // Responses API returns output[].content[].text
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

    private function extractUsage(array $data): array
    {
        return [
            'input_tokens' => (int) ($data['usage']['input_tokens'] ?? 0),
            'output_tokens' => (int) ($data['usage']['output_tokens'] ?? 0),
        ];
    }
}
