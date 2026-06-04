<?php

declare(strict_types=1);

namespace App\Providers;

use App\Ai\AiClient;
use App\Ai\AiClientManager;
use App\Ai\AiConfigValidator;
use App\Ai\Contracts\ContentRelevanceAssessor;
use App\Ai\Contracts\ConversationReviewer;
use App\Ai\Contracts\ConversationTurnHandler;
use App\Ai\Contracts\PronunciationAnalyzer;
use App\Ai\Contracts\SpeakingFeedbackGenerator;
use App\Ai\Contracts\TaskFulfillmentAssessor;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Contracts\RubricResolver as AssessmentRubricResolver;
use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Rubrics\DatabaseRubricResolver;
use App\Assessment\Services\AssessmentManager;
use App\Assessment\Strategies\SpeakingPart1PersonalStrategy;
use App\Assessment\Strategies\SpeakingPart2SolutionStrategy;
use App\Assessment\Strategies\SpeakingPart3DiscussionStrategy;
use App\Assessment\Strategies\WritingTask1LetterStrategy;
use App\Assessment\Strategies\WritingTask2EssayStrategy;
use App\Models\Profile;
use App\Models\User;
use App\Services\Admin\Course\AdminCourseBookingService;
use App\Services\Admin\Course\AdminCourseEnrollmentService;
use App\Services\Admin\Course\AdminCourseScheduleService;
use App\Services\Admin\Course\Contracts\AdminCourseBookingInterface;
use App\Services\Admin\Course\Contracts\AdminCourseEnrollmentInterface;
use App\Services\Admin\Course\Contracts\AdminCourseScheduleInterface;
use App\Services\Ai\LlmContentRelevanceAssessor;
use App\Services\Ai\LlmConversationReviewer;
use App\Services\Ai\LlmConversationTurnHandler;
use App\Services\Ai\LlmPronunciationAnalyzer;
use App\Services\Ai\LlmSpeakingFeedbackGenerator;
use App\Services\Ai\LlmTaskFulfillmentAssessor;
use App\Services\Ai\LlmWritingFeedbackGenerator;
use App\Services\Contracts\ExamCatalogInterface;
use App\Services\Contracts\ExamSessionResultInterface;
use App\Services\Contracts\LearningPathInterface;
use App\Services\ConversationServiceInterface;
use App\Services\ExamCatalogService;
use App\Services\ExamSessionResultService;
use App\Services\Grading\RubricResolver;
use App\Services\Grading\SpeakingScoringFormula;
use App\Services\Grading\WritingScoringFormula;
use App\Services\LearningPathService;
use App\Services\Payment\PaymentGatewayRegistry;
use App\Services\Payment\PayOsGateway;
use App\Services\Payment\VnPayGateway;
use App\Services\SpeakingConversationService;
use App\Services\SpeechToText;
use App\Services\SpeechToTextService;
use App\Srs\FsrsConfig;
use Carbon\CarbonImmutable;
use Google\Client as GoogleClient;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Queue\Events\JobProcessed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    private const EMAIL_VERIFICATION_LINK_TTL_MINUTES = 60;

    public function register(): void
    {
        $this->app->singleton(FsrsConfig::class, fn () => FsrsConfig::default());

        $this->app->singleton(GoogleClient::class, function () {
            $clientId = (string) config('services.google.client_id');
            if ($clientId === '') {
                throw new \RuntimeException('GOOGLE_CLIENT_ID is not configured.');
            }

            return new GoogleClient(['client_id' => $clientId]);
        });

        // ── AI Client — provider-agnostic gateway, retry + circuit breaker built-in
        $this->app->singleton(AiClient::class, AiClientManager::class);

        // ── AI Contracts → Implementations
        $this->app->bind(TaskFulfillmentAssessor::class, LlmTaskFulfillmentAssessor::class);
        $this->app->bind(WritingFeedbackGenerator::class, LlmWritingFeedbackGenerator::class);
        $this->app->bind(SpeakingFeedbackGenerator::class, LlmSpeakingFeedbackGenerator::class);
        $this->app->bind(ContentRelevanceAssessor::class, LlmContentRelevanceAssessor::class);
        $this->app->bind(ConversationTurnHandler::class, LlmConversationTurnHandler::class);
        $this->app->bind(ConversationReviewer::class, LlmConversationReviewer::class);
        $this->app->bind(PronunciationAnalyzer::class, LlmPronunciationAnalyzer::class);

        // STT: Azure Speech-to-Text.
        $this->app->bind(SpeechToText::class, SpeechToTextService::class);

        // Rubric resolver — scoped so cache resets per request (Octane-safe).
        $this->app->scoped(RubricResolver::class);

        $this->app->scoped(WritingScoringFormula::class, fn ($app) => $app->make(AssessmentManager::class)->writingFormula());
        $this->app->scoped(SpeakingScoringFormula::class, fn ($app) => $app->make(AssessmentManager::class)->speakingFormula());

        $this->app->bind(ConversationServiceInterface::class, SpeakingConversationService::class);

        $this->app->bind(LearningPathInterface::class, LearningPathService::class);

        $this->app->bind(ExamCatalogInterface::class, ExamCatalogService::class);

        $this->app->bind(ExamSessionResultInterface::class, ExamSessionResultService::class);

        $this->app->bind(AssessmentRubricResolver::class, DatabaseRubricResolver::class);
        $this->app->scoped(AssessmentManager::class, fn ($app) => new AssessmentManager($app, $app->make(RubricResolver::class), [
            AssessmentTaskType::WritingTask1Letter->value => WritingTask1LetterStrategy::class,
            AssessmentTaskType::WritingTask2Essay->value => WritingTask2EssayStrategy::class,
            AssessmentTaskType::SpeakingPart1Personal->value => SpeakingPart1PersonalStrategy::class,
            AssessmentTaskType::SpeakingPart2Solution->value => SpeakingPart2SolutionStrategy::class,
            AssessmentTaskType::SpeakingPart3Discussion->value => SpeakingPart3DiscussionStrategy::class,
        ]));

        $this->app->bind(AdminCourseBookingInterface::class, AdminCourseBookingService::class);
        $this->app->bind(AdminCourseEnrollmentInterface::class, AdminCourseEnrollmentService::class);
        $this->app->bind(AdminCourseScheduleInterface::class, AdminCourseScheduleService::class);

        $this->app->singleton(PaymentGatewayRegistry::class, fn () => new PaymentGatewayRegistry([
            'payos' => $this->app->make(PayOsGateway::class),
            'vnpay' => $this->app->make(VnPayGateway::class),
        ]));
    }

    public function boot(): void
    {
        Model::shouldBeStrict(! app()->isProduction());
        Date::use(CarbonImmutable::class);

        View::addLocation(resource_path());

        (new AiConfigValidator)->validate();

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $email = is_string($notifiable->email ?? null) ? $notifiable->email : '';
            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
            $url = $frontendUrl.'/?'.http_build_query([
                'auth' => 'reset',
                'email' => $email,
                'token' => $token,
            ]);

            return (new MailMessage)
                ->subject('Đặt lại mật khẩu VSTEP')
                ->line('Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản VSTEP.')
                ->action('Đặt lại mật khẩu', $url)
                ->line('Liên kết đặt lại mật khẩu sẽ hết hạn sau 60 phút.')
                ->line('Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.');
        });

        VerifyEmail::createUrlUsing(function (object $notifiable): string {
            if (! $notifiable instanceof User) {
                throw new \RuntimeException('Email verification notification requires a User notifiable.');
            }

            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(self::EMAIL_VERIFICATION_LINK_TTL_MINUTES),
                ['id' => (string) $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())],
            );
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Xác thực email VSTEP')
                ->line('Bạn nhận được email này vì đã đăng ký tài khoản VSTEP.')
                ->action('Xác thực email', $url)
                ->line('Liên kết xác thực email sẽ hết hạn sau 60 phút.')
                ->line('Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.');
        });

        Request::macro('profile', function (): Profile {
            /** @var Profile|null $profile */
            $profile = $this->attributes->get('active_profile');
            if ($profile === null) {
                throw new \RuntimeException('Active profile macro called outside active-profile middleware.');
            }

            return $profile;
        });

        // Flush scoped instances after each queue job to prevent cached
        // data (e.g. RubricResolver) from leaking between jobs in long-
        // running Horizon workers. Without this, a migrate/reseed of
        // grading_rubrics after a job loads the rubric causes stale FK
        // references in subsequent jobs.
        Queue::after(function (JobProcessed $event): void {
            $this->app->forgetScopedInstances();
        });

        Queue::failing(function (JobFailed $event): void {
            $this->app->forgetScopedInstances();
        });
    }
}
