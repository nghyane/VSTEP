<?php

declare(strict_types=1);

namespace Tests;

use App\Ai\AiClient;
use App\Ai\Contracts\ContentRelevanceAssessor;
use App\Ai\Contracts\ConversationReviewer;
use App\Ai\Contracts\ConversationTurnHandler;
use App\Ai\Contracts\PronunciationAnalyzer;
use App\Ai\Contracts\TaskFulfillmentAssessor;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Services\LanguageToolService;
use App\Services\SpeechToText;
use Database\Seeders\AssessmentRubricSeeder;
use Database\Seeders\GradingRubricSeeder;
use Database\Seeders\SystemConfigSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeAiClient;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SystemConfigSeeder::class);
        $this->seed(GradingRubricSeeder::class);
        $this->seed(AssessmentRubricSeeder::class);

        // Bind all AI contracts to fake implementations — no HTTP calls in tests.
        $fakeAi = new FakeAiClient;

        $this->app->singleton(AiClient::class, fn () => $fakeAi);
        $this->app->bind(TaskFulfillmentAssessor::class, fn () => new Support\FakeTaskFulfillmentAssessor);
        $this->app->bind(WritingFeedbackGenerator::class, fn () => new Support\FakeWritingFeedbackGenerator);
        $this->app->bind(ContentRelevanceAssessor::class, fn () => new Support\FakeContentRelevanceAssessor);
        $this->app->bind(ConversationTurnHandler::class, fn () => new Support\FakeConversationTurnHandler);
        $this->app->bind(ConversationReviewer::class, fn () => new Support\FakeConversationReviewer);
        $this->app->bind(PronunciationAnalyzer::class, fn () => new Support\FakePronunciationAnalyzer);

        $this->app->bind(SpeechToText::class, Support\FakeSpeechToText::class);

        $this->app->bind(LanguageToolService::class, function () {
            $mock = $this->createMock(LanguageToolService::class);
            $mock->method('check')->willReturn([]);
            $mock->method('toAnnotations')->willReturn([]);

            return $mock;
        });
    }
}
