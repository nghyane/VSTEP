<?php

declare(strict_types=1);

namespace Tests\Feature\Audio;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

final class AudioTranscribeTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_can_transcribe_uploaded_audio(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->post('/api/v1/audio/transcribe', [
                'language' => 'en-US',
                'audio' => UploadedFile::fake()->create('speech.webm', 64, 'audio/webm'),
            ]);

        $response->assertOk()
            ->assertJsonPath('data.transcript', 'This is a test transcript.')
            ->assertJsonPath('data.confidence', 0.9)
            ->assertJsonPath('data.duration_ms', 5000);
    }

    public function test_transcribe_requires_audio_or_storage_key(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/audio/transcribe', ['language' => 'en-US']);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Thiếu audio hoặc audio_key để nhận diện giọng nói.');
    }
}
