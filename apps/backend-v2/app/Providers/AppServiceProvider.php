<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\ChatCompletionsGateway;
use App\Models\Profile;
use App\Services\ConversationServiceInterface;
use App\Services\Grading\GradingStrategyResolver;
use App\Services\Grading\LlmGrader;
use App\Services\Grading\LlmGradingService;
use App\Services\Grading\SpeakingGradingStrategy;
use App\Services\Grading\WritingGradingStrategy;
use App\Services\SpeakingConversationService;
use App\Services\SpeechToText;
use App\Services\SpeechToTextService;
use App\Srs\FsrsConfig;
use Carbon\CarbonImmutable;
use Google\Client as GoogleClient;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;
use Laravel\Ai\AiManager;
use Laravel\Ai\Providers\OpenAiProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FsrsConfig::class, fn () => FsrsConfig::default());

        // Google OAuth client — singleton so JWKS cache + Guzzle client are
        // reused across Octane requests. Verifying client_id at boot fails
        // fast in production if the env is missing.
        $this->app->singleton(GoogleClient::class, function () {
            $clientId = (string) config('services.google.client_id');
            if ($clientId === '') {
                throw new \RuntimeException('GOOGLE_CLIENT_ID is not configured.');
            }

            return new GoogleClient(['client_id' => $clientId]);
        });

        // Default LLM grader implementation.
        $this->app->bind(LlmGrader::class, LlmGradingService::class);

        // Default Speech-to-Text implementation.
        $this->app->bind(SpeechToText::class, SpeechToTextService::class);

        // Grading strategy registry — explicit list, ordered.
        $this->app->singleton(GradingStrategyResolver::class, fn ($app) => new GradingStrategyResolver([
            $app->make(WritingGradingStrategy::class),
            $app->make(SpeakingGradingStrategy::class),
        ]));

        // Conversation service — interface binding for testability.
        $this->app->bind(ConversationServiceInterface::class, SpeakingConversationService::class);

        $this->app->resolving(AiManager::class, function (AiManager $ai, $app): void {
            $ai->extend('chat-completions', function ($app, array $config) {
                return new OpenAiProvider(
                    new ChatCompletionsGateway($app['events']),
                    $config,
                    $app->make(Dispatcher::class),
                );
            });
        });
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! app()->isProduction());
        Date::use(CarbonImmutable::class);

        Request::macro('profile', function (): Profile {
            /** @var Profile|null $profile */
            $profile = $this->attributes->get('active_profile');
            if ($profile === null) {
                throw new \RuntimeException('Active profile macro called outside active-profile middleware.');
            }

            return $profile;
        });
    }
}
