<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\AudioStorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Tests\TestCase;

class AudioStorageFailureTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_returns_503_when_read_presign_storage_is_unavailable(): void
    {
        $user = User::create([
            'full_name' => 'Learner',
            'email' => 'audio-read@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $this->actingAs($user, 'api');
        $this->app->bind(AudioStorageService::class, fn () => new class extends AudioStorageService
        {
            public function exists(string $path): bool
            {
                throw new ServiceUnavailableHttpException(null, 'Audio storage is temporarily unavailable.');
            }
        });

        $this->getJson('/api/v1/audio/presign?path=listening/sample.mp3')
            ->assertStatus(503)
            ->assertJson([
                'message' => 'Audio storage is temporarily unavailable.',
            ]);
    }

    #[Test]
    public function it_returns_503_when_upload_presign_storage_is_unavailable(): void
    {
        $user = User::create([
            'full_name' => 'Learner',
            'email' => 'audio-upload@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $this->actingAs($user, 'api');
        $this->app->bind(AudioStorageService::class, fn () => new class extends AudioStorageService
        {
            public function temporaryUploadUrl(string $path, string $contentType, int $expiresInSeconds): array
            {
                throw new ServiceUnavailableHttpException(null, 'Audio storage is temporarily unavailable.');
            }
        });

        $this->postJson('/api/v1/uploads/presign', [
            'content_type' => 'audio/wav',
            'file_size' => 1024,
        ])
            ->assertStatus(503)
            ->assertJson([
                'message' => 'Audio storage is temporarily unavailable.',
            ]);
    }
}
