<?php

declare(strict_types=1);

namespace Tests;

use App\Ai\Agents\ConversationReviewAgent;
use App\Ai\Agents\ConversationTurnAgent;
use App\Services\Grading\LlmGrader;
use App\Services\SpeechToText;
use Database\Seeders\SystemConfigSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeConversationReviewAgent;
use Tests\Support\FakeConversationTurnAgent;
use Tests\Support\FakeLlmGrader;
use Tests\Support\FakeSpeechToText;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SystemConfigSeeder::class);

        $this->app->bind(LlmGrader::class, FakeLlmGrader::class);
        $this->app->bind(SpeechToText::class, FakeSpeechToText::class);
        $this->app->bind(ConversationTurnAgent::class, FakeConversationTurnAgent::class);
        $this->app->bind(ConversationReviewAgent::class, FakeConversationReviewAgent::class);
    }
}
