<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\AiClient;
use App\Ai\AiClientManager;
use App\Ai\AiConfigValidator;
use App\Models\Profile;
use App\Services\Admin\Course\AdminCourseBookingService;
use App\Services\Admin\Course\AdminCourseEnrollmentService;
use App\Services\Admin\Course\AdminCourseScheduleService;
use App\Services\Admin\Course\Contracts\AdminCourseBookingInterface;
use App\Services\Admin\Course\Contracts\AdminCourseEnrollmentInterface;
use App\Services\Admin\Course\Contracts\AdminCourseScheduleInterface;
use App\Services\ConversationServiceInterface;
use App\Services\Grading\GradingStrategyResolver;
use App\Services\Grading\LlmGrader;
use App\Services\Grading\LlmGradingService;
use App\Services\Grading\RubricResolver;
use App\Services\Grading\SpeakingGradingStrategy;
use App\Services\Grading\WritingGradingStrategy;
use App\Services\Payment\PaymentGatewayRegistry;
use App\Services\Payment\PayOsGateway;
use App\Services\Payment\VnPayGateway;
use App\Services\SpeakingConversationService;
use App\Services\SpeechToText;
use App\Services\SpeechToTextService;
use App\Srs\FsrsConfig;
use Carbon\CarbonImmutable;
use Google\Client as GoogleClient;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;

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

        // AI Client — provider-agnostic gateway.
        $this->app->singleton(AiClient::class, AiClientManager::class);

        // Default LLM grader implementation.
        $this->app->bind(LlmGrader::class, LlmGradingService::class);

        // Default Speech-to-Text implementation.
        $this->app->bind(SpeechToText::class, SpeechToTextService::class);

        // Rubric resolver — scoped so cache resets per request (Octane-safe).
        $this->app->scoped(RubricResolver::class);

        // Grading strategy registry — explicit list, ordered.
        $this->app->singleton(GradingStrategyResolver::class, fn ($app) => new GradingStrategyResolver([
            $app->make(WritingGradingStrategy::class),
            $app->make(SpeakingGradingStrategy::class),
        ]));

        // Conversation service — interface binding for testability.
        $this->app->bind(ConversationServiceInterface::class, SpeakingConversationService::class);

        // Admin course sub-services for decomposition.
        $this->app->bind(AdminCourseBookingInterface::class, AdminCourseBookingService::class);
        $this->app->bind(AdminCourseEnrollmentInterface::class, AdminCourseEnrollmentService::class);
        $this->app->bind(AdminCourseScheduleInterface::class, AdminCourseScheduleService::class);

        // Payment gateway registry.
        $this->app->singleton(PaymentGatewayRegistry::class, fn () => new PaymentGatewayRegistry([
            'payos' => $this->app->make(PayOsGateway::class),
            'vnpay' => $this->app->make(VnPayGateway::class),
        ]));
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! app()->isProduction());
        Date::use(CarbonImmutable::class);

        // Fail-fast: validate AI config at boot.
        (new AiConfigValidator)->validate();

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
