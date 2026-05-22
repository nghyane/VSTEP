<?php

declare(strict_types=1);

namespace Tests;

use App\Services\Grading\LlmGrader;
use App\Services\SpeechToText;
use Database\Seeders\SystemConfigSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeLlmGrader;
use Tests\Support\FakeSpeechToText;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // System configs are needed by wallet/onboarding flows in almost every test.
        // Kept light — only scalars, fast seeder.
        $this->seed(SystemConfigSeeder::class);

        // Stub external dependencies — real providers need API keys + cost money.
        // Strategies throw on failure (no silent fallback) so tests must stub.
        $this->app->bind(LlmGrader::class, FakeLlmGrader::class);
        $this->app->bind(SpeechToText::class, FakeSpeechToText::class);
    }
}
