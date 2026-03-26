<?php

declare(strict_types=1);

namespace App\Ai;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Laravel\Ai\Gateway\OpenAi\OpenAiGateway;
use Laravel\Ai\Providers\Provider;

class LocalOpenAiGateway extends OpenAiGateway
{
    protected function client(Provider $provider, ?int $timeout = null): PendingRequest
    {
        $url = $provider->additionalConfiguration()['url'] ?? 'https://api.openai.com/v1';

        return Http::baseUrl($url)
            ->withToken($provider->providerCredentials()['key'])
            ->timeout($timeout ?? 90)
            ->throw();
    }
}
