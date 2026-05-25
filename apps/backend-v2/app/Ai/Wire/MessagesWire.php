<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;
use RuntimeException;

/**
 * Anthropic Messages API — POST /v1/messages
 * Structured output via tool_use (forced tool call).
 */
final class MessagesWire implements WireFormat
{
    public function send(PendingRequest $http, WireRequest $request): WireResponse
    {
        $body = [
            'model' => $request->model,
            'max_tokens' => 8192,
            'messages' => [['role' => 'user', 'content' => $request->prompt]],
        ];

        if ($request->thinking !== 'none') {
            $body['thinking'] = [
                'type' => 'enabled',
                'budget_tokens' => $this->thinkingBudget($request->thinking),
            ];
            $body['max_tokens'] += $body['thinking']['budget_tokens'];
        } else {
            $body['thinking'] = ['type' => 'disabled'];
        }

        if ($request->instructions !== null && $request->instructions !== '') {
            $body['system'] = $request->instructions;
        }

        if ($request->temperature !== null) {
            $body['temperature'] = $request->temperature;
        }

        // Structured output: tool_use with tool_choice
        // thinking enabled → 'any' (force tool but not by name)
        // thinking disabled → 'tool' (force specific tool)
        if ($request->schema !== null) {
            $body['tools'] = [[
                'name' => 'structured_output',
                'description' => 'Return structured data',
                'input_schema' => [
                    'type' => 'object',
                    'properties' => $request->schema,
                    'required' => array_keys($request->schema),
                ],
            ]];
            $body['tool_choice'] = $request->thinking !== 'none'
                ? ['type' => 'any']
                : ['type' => 'tool', 'name' => 'structured_output'];
        }

        $response = $http->timeout($request->timeout)->post('v1/messages', $body);
        $data = $response->json();

        $this->validateResponse($data);

        $structured = $request->schema !== null
            ? $this->extractToolInput($data)
            : null;
        $text = $structured !== null
            ? json_encode($structured)
            : $this->extractText($data);

        return new WireResponse(
            text: $text,
            structured: $structured,
            usage: [
                'input_tokens' => (int) ($data['usage']['input_tokens'] ?? 0),
                'output_tokens' => (int) ($data['usage']['output_tokens'] ?? 0),
            ],
            model: $data['model'] ?? $request->model,
        );
    }

    private function extractToolInput(array $data): ?array
    {
        foreach ($data['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'tool_use') {
                return is_array($block['input'] ?? null) ? $block['input'] : null;
            }
        }

        return null;
    }

    private function extractText(array $data): string
    {
        foreach ($data['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text') {
                return $block['text'] ?? '';
            }
        }

        return '';
    }

    private function validateResponse(mixed $data): void
    {
        if (! is_array($data) || ($data['type'] ?? '') === 'error') {
            throw new RuntimeException(sprintf(
                'Messages API error: %s',
                $data['error']['message'] ?? 'Unknown error',
            ));
        }
    }

    private function thinkingBudget(string $level): int
    {
        return match ($level) {
            'low' => 1024,
            'medium' => 4096,
            'high' => 16384,
            default => 1024,
        };
    }
}
