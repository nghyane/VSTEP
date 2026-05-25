<?php

declare(strict_types=1);

namespace Tests\Unit\Ai;

use App\Ai\AiConfigValidator;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use Tests\TestCase;

final class AiConfigValidatorTest extends TestCase
{
    public function test_passes_with_valid_config(): void
    {
        $this->expectNotToPerformAssertions();
        (new AiConfigValidator)->validate();
    }

    public function test_fails_on_missing_connection_url(): void
    {
        Config::set('ai.connections.packy.url', '');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("ai.connections.packy: missing 'url'");
        (new AiConfigValidator)->validate();
    }

    public function test_fails_on_undefined_model_connection(): void
    {
        Config::set('ai.models.broken', [
            'connection' => 'nonexistent',
            'wire' => 'chat',
            'id' => 'x',
        ]);
        Config::set('ai.services.test', ['model' => 'broken']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('undefined connection');
        (new AiConfigValidator)->validate();
    }

    public function test_fails_on_invalid_wire(): void
    {
        Config::set('ai.models.broken', [
            'connection' => 'packy',
            'wire' => 'graphql',
            'id' => 'x',
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("invalid wire 'graphql'");
        (new AiConfigValidator)->validate();
    }

    public function test_fails_on_undefined_service_model(): void
    {
        Config::set('ai.services.broken', ['model' => 'nonexistent']);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage("undefined model 'nonexistent'");
        (new AiConfigValidator)->validate();
    }
}
