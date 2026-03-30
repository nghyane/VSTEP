<?php

declare(strict_types=1);

namespace App\Ai;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Gateway\OpenAi\OpenAiGateway;
use Laravel\Ai\Gateway\TextGenerationOptions;
use Laravel\Ai\Providers\Provider;

class LocalOpenAiGateway extends OpenAiGateway
{
    protected function buildTextRequestBody(
        Provider $provider,
        string $model,
        ?string $instructions,
        array $messages,
        array $tools,
        ?array $schema,
        ?TextGenerationOptions $options,
    ): array {
        $body = parent::buildTextRequestBody(
            $provider,
            $model,
            $instructions,
            $messages,
            $tools,
            $schema,
            $options,
        );

        // Local gateway is OpenAI-compatible, but does not accept Responses API max_output_tokens.
        unset($body['max_output_tokens']);

        return $body;
    }

    protected function client(Provider $provider, ?int $timeout = null): PendingRequest
    {
        $url = $provider->additionalConfiguration()['url'] ?? 'https://api.openai.com/v1';

        return Http::baseUrl($url)
            ->withToken($provider->providerCredentials()['key'])
            ->timeout($timeout ?? 90)
            ->throw();
    }
}
