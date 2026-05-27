<?php

declare(strict_types=1);

namespace Tests;

use App\Ai\AiClient;
use App\Services\Grading\LlmGrader;
use App\Services\LanguageToolService;
use App\Services\SpeechToText;
use Database\Seeders\GradingRubricSeeder;
use Database\Seeders\SystemConfigSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeAiClient;
use Tests\Support\FakeLlmGrader;
use Tests\Support\FakeSpeechToText;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SystemConfigSeeder::class);
        $this->seed(GradingRubricSeeder::class);

        $this->app->bind(LlmGrader::class, FakeLlmGrader::class);
        $this->app->bind(SpeechToText::class, FakeSpeechToText::class);
        $this->app->singleton(AiClient::class, FakeAiClient::class);

        $this->app->bind(LanguageToolService::class, function () {
            $mock = $this->createMock(LanguageToolService::class);
            $mock->method('check')->willReturn([]);
            $mock->method('toAnnotations')->willReturn([]);

            return $mock;
        });
    }
}
