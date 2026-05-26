<?php

declare(strict_types=1);

namespace App\Ai;

use App\Ai\Wire\ChatCompletionsWire;
use App\Ai\Wire\MessagesWire;
use App\Ai\Wire\ResponsesWire;
use App\Ai\Wire\WireFormat;
use App\Ai\Wire\WireRequest;
use App\Ai\Wire\WireResponse;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Adapter — resolves service config → connection + wire → sends request.
 * Domain services only see AiClient interface.
 */
final class AiClientManager implements AiClient
{
    /** @var array<string, WireFormat> */
    private array $wires = [];

    public function __construct()
    {
        $this->wires = [
            'responses' => new ResponsesWire,
            'chat' => new ChatCompletionsWire,
            'messages' => new MessagesWire,
        ];
    }

    public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
    {
        $config = $this->resolveService($service);

        $request = new WireRequest(
            model: $config['model_id'],
            prompt: $prompt,
            instructions: $instructions,
            schema: $parametersSchema,
            toolName: $toolName,
            toolDescription: $toolDescription,
            timeout: $config['timeout'],
            thinking: $config['thinking'],
        );

        $response = $this->send($service, $config, $request);

        if (! is_array($response->structured)) {
            throw new RuntimeException("AI service [{$service}]: tool call returned invalid arguments");
        }

        return $response->structured;
    }

    public function text(string $service, string $prompt, ?string $instructions = null): string
    {
        $config = $this->resolveService($service);

        $request = new WireRequest(
            model: $config['model_id'],
            prompt: $prompt,
            instructions: $instructions,
            timeout: $config['timeout'],
            thinking: $config['thinking'],
        );

        return $this->send($service, $config, $request)->text;
    }

    private function send(string $service, array $config, WireRequest $request): WireResponse
    {
        $wire = $this->wires[$config['wire']] ?? null;

        if ($wire === null) {
            throw new RuntimeException("Unknown wire format: {$config['wire']}");
        }

        $http = $this->buildHttp($config);
        $start = microtime(true);

        try {
            $response = $wire->send($http, $request);
        } catch (\Throwable $e) {
            $this->logCall($service, $config, microtime(true) - $start, null, $e);

            throw $e;
        }

        $this->logCall($service, $config, microtime(true) - $start, $response);

        return $response;
    }

    private function logCall(string $service, array $config, float $duration, ?WireResponse $response, ?\Throwable $error = null): void
    {
        $context = [
            'service' => $service,
            'model' => $config['model_id'],
            'wire' => $config['wire'],
            'duration_ms' => (int) ($duration * 1000),
        ];

        if ($response !== null) {
            $context['input_tokens'] = $response->usage['input_tokens'];
            $context['output_tokens'] = $response->usage['output_tokens'];
        }

        if ($error !== null) {
            $context['error'] = $error->getMessage();
            Log::channel('ai')->warning('ai.call.failed', $context);
        } else {
            Log::channel('ai')->info('ai.call.ok', $context);
        }
    }

    /**
     * Resolve service name → merged config (connection + model).
     *
     * @return array{model_id: string, wire: string, url: string, key: string, timeout: int, thinking: string}
     */
    private function resolveService(string $service): array
    {
        $serviceConfig = config("ai.services.{$service}");
        if (! is_array($serviceConfig)) {
            throw new RuntimeException("AI service [{$service}] is not configured");
        }

        $modelName = $serviceConfig['model'] ?? null;
        if ($modelName === null) {
            throw new RuntimeException("AI service [{$service}] has no model configured");
        }

        $modelConfig = config("ai.models.{$modelName}");
        if (! is_array($modelConfig)) {
            throw new RuntimeException("AI model [{$modelName}] is not configured");
        }

        $connectionName = $modelConfig['connection'] ?? null;
        $connectionConfig = config("ai.connections.{$connectionName}");
        if (! is_array($connectionConfig)) {
            throw new RuntimeException("AI connection [{$connectionName}] is not configured");
        }

        return [
            'model_id' => $modelConfig['id'] ?? $modelName,
            'wire' => $modelConfig['wire'] ?? 'chat',
            'url' => rtrim($connectionConfig['url'] ?? '', '/'),
            'key' => $connectionConfig['key'] ?? '',
            'timeout' => $serviceConfig['timeout'] ?? 60,
            'thinking' => $modelConfig['thinking'] ?? 'none',
        ];
    }

    private function buildHttp(array $config): PendingRequest
    {
        return Http::baseUrl($config['url'])
            ->withToken($config['key'])
            ->throw();
    }
}
