<?php

declare(strict_types=1);

namespace App\Ai;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Gateway\OpenAi\OpenAiGateway;
use Laravel\Ai\Gateway\TextGenerationOptions;
use Laravel\Ai\Providers\Provider;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\StructuredTextResponse;
use Laravel\Ai\Responses\TextResponse;

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

    protected function continueWithToolResults(
        string $responseId,
        string $model,
        Provider $provider,
        bool $structured,
        array $tools,
        ?array $schema,
        Collection $steps,
        Collection $messages,
        array $toolResults,
        int $depth,
        ?int $maxSteps,
    ): TextResponse {
        if ($structured) {
            return (new StructuredTextResponse(
                [],
                '',
                $this->combineUsage($steps),
                new Meta($provider->name(), $model),
            ))->withToolCallsAndResults(
                toolCalls: $steps->flatMap(fn ($step) => $step->toolCalls),
                toolResults: $steps->flatMap(fn ($step) => $step->toolResults),
            )->withSteps($steps);
        }

        return (new TextResponse(
            '',
            $this->combineUsage($steps),
            new Meta($provider->name(), $model),
        ))->withMessages($messages)->withSteps($steps);
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
