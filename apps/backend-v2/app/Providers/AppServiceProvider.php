<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\ChatCompletionsGateway;
use App\Ai\LocalOpenAiGateway;
use App\Srs\FsrsConfig;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Laravel\Ai\AiManager;
use Laravel\Ai\Providers\OpenAiProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FsrsConfig::class, fn () => FsrsConfig::default());

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
    }
}
