<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\LocalOpenAiGateway;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;
use Laravel\Ai\AiManager;
use Laravel\Ai\Providers\OpenAiProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! app()->isProduction());

        /** @var AiManager $ai */
        $ai = $this->app->make(AiManager::class);
        $ai->extend('local', function ($app, array $config) {
            return new OpenAiProvider(
                new LocalOpenAiGateway($app['events']),
                $config,
                $app->make(Dispatcher::class),
            );
        });
    }
}
