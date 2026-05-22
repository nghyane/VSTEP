<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\ChatCompletionsGateway;
use App\Ai\LocalOpenAiGateway;
use App\Models\Profile;
use App\Services\Grading\GradingStrategyResolver;
use App\Services\Grading\LlmGrader;
use App\Services\Grading\LlmGradingService;
use App\Services\Grading\SpeakingGradingStrategy;
use App\Services\Grading\WritingGradingStrategy;
use App\Services\SpeechToText;
use App\Services\SpeechToTextService;
use App\Srs\FsrsConfig;
use Carbon\CarbonImmutable;
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

        // Default LLM grader implementation.
        $this->app->bind(LlmGrader::class, LlmGradingService::class);

        // Default Speech-to-Text implementation.
        $this->app->bind(SpeechToText::class, SpeechToTextService::class);

        // Grading strategy registry — explicit list, ordered.
        $this->app->singleton(GradingStrategyResolver::class, fn ($app) => new GradingStrategyResolver([
            $app->make(WritingGradingStrategy::class),
            $app->make(SpeakingGradingStrategy::class),
        ]));

        $this->app->resolving(AiManager::class, function (AiManager $ai, $app): void {
            $ai->extend('local', function ($app, array $config) {
                return new OpenAiProvider(
                    new LocalOpenAiGateway($app['events']),
                    $config,
                    $app->make(Dispatcher::class),
                );
            });

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
