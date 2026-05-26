<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * OpenAI Chat Completions API — POST /v1/chat/completions
 * Universal format supported by most proxies and local models.
 * Structured output via tool calling (function calling) for maximum
 * provider compatibility — avoids response_format: json_schema pitfalls.
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
            $body['tools'] = [$this->buildToolDefinition(
                $request->toolName ?? 'structured_output',
                $request->toolDescription ?? 'Return structured data',
                $request->schema,
            )];
            $body['tool_choice'] = [
                'type' => 'function',
                'function' => ['name' => $request->toolName ?? 'structured_output'],
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

        $structured = $request->schema !== null
            ? $this->extractToolArguments($data)
            : null;
        $text = $structured !== null
            ? json_encode($structured)
            : trim((string) data_get($data, 'choices.0.message.content', ''));

        return new WireResponse(
            text: $text,
            structured: $structured,
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

    /**
     * @param  array<string,mixed>  $parametersSchema
     * @return array<string,mixed>
     */
    private function buildToolDefinition(string $name, string $description, array $parametersSchema): array
    {
        return [
            'type' => 'function',
            'function' => [
                'name' => $name,
                'description' => $description,
                'parameters' => [
                    'type' => 'object',
                    'properties' => $parametersSchema,
                    'required' => array_keys($parametersSchema),
                    'additionalProperties' => false,
                ],
            ],
        ];
    }

    private function extractToolArguments(array $data): ?array
    {
        $toolCalls = data_get($data, 'choices.0.message.tool_calls', []);
        if (! is_array($toolCalls) || count($toolCalls) === 0) {
            return null;
        }

        $arguments = $toolCalls[0]['function']['arguments'] ?? null;
        if (! is_string($arguments) || $arguments === '') {
            return null;
        }

        $decoded = json_decode($arguments, true);

        return is_array($decoded) ? $decoded : null;
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
