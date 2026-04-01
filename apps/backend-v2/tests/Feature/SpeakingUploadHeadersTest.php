<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\AudioStorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SpeakingUploadHeadersTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_returns_presign_headers_as_strings(): void
    {
        $user = User::create([
            'full_name' => 'Upload Tester',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'role' => 'learner',
        ]);

        $storage = Mockery::mock(AudioStorageService::class);
        $storage->shouldReceive('temporaryUploadUrl')
            ->once()
            ->andReturn([
                'url' => 'https://example.com/upload',
                'headers' => [
                    'Host' => 'example.com',
                    'Content-Type' => 'audio/wav',
                ],
            ]);

        $this->app->instance(AudioStorageService::class, $storage);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/uploads/presign', [
                'content_type' => 'audio/wav',
                'file_size' => 1024,
            ])
            ->assertOk()
            ->assertJsonPath('data.headers.Host', 'example.com')
            ->assertJsonPath('data.headers.Content-Type', 'audio/wav');
    }
}
