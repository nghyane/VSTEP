<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * OpenAI Chat Completions API — POST /v1/chat/completions
 * Universal format supported by most proxies and local models.
 */
final class ChatCompletionsWire implements WireFormat
{
    public function send(PendingRequest $http, WireRequest $request): WireResponse
    {
        $body = [
            'model' => $request->model,
            'messages' => $this->buildMessages($request),
        ];

        if ($request->schema !== null) {
            $body['response_format'] = [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'structured_output',
                    'schema' => [
                        'type' => 'object',
                        'properties' => $request->schema,
                        'required' => array_keys($request->schema),
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ];
        }

        if ($request->temperature !== null) {
            $body['temperature'] = $request->temperature;
        }

        if ($request->thinking !== 'none') {
            $body['reasoning_effort'] = $request->thinking;
        }

        $response = $http->timeout($request->timeout)->post('v1/chat/completions', $body);
        $data = $response->json();

        $this->validateResponse($data);

        $text = trim((string) data_get($data, 'choices.0.message.content', ''));

        return new WireResponse(
            text: $text,
            structured: $request->schema !== null ? json_decode($text, true) : null,
            usage: [
                'input_tokens' => (int) data_get($data, 'usage.prompt_tokens', 0),
                'output_tokens' => (int) data_get($data, 'usage.completion_tokens', 0),
            ],
            model: $data['model'] ?? $request->model,
        );
    }

    private function buildMessages(WireRequest $request): array
    {
        $messages = [];

        if ($request->instructions !== null && $request->instructions !== '') {
            $messages[] = ['role' => 'system', 'content' => $request->instructions];
        }

        $messages[] = ['role' => 'user', 'content' => $request->prompt];

        return $messages;
    }

    private function validateResponse(mixed $data): void
    {
        if (! is_array($data) || isset($data['error'])) {
            throw new RuntimeException(sprintf(
                'Chat Completions API error: %s',
                $data['error']['message'] ?? 'Unknown error',
            ));
        }
    }
}
