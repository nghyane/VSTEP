<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\PracticeWritingPrompt;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WritingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_prompts(): void
    {
        PracticeWritingPrompt::factory()->count(2)->create(['part' => 1]);
        PracticeWritingPrompt::factory()->create(['part' => 2]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/writing/prompts?part=1')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_show_prompt_with_children(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/writing/prompts/{$prompt->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $prompt->id);
        $response->assertJsonStructure(['data' => [
            'outline_sections', 'template_sections', 'sample_markers',
        ]]);
    }

    public function test_full_writing_flow(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->tokenFor($user);

        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id]);
        $start->assertCreated();
        $sessionId = $start->json('data.session_id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", [
                'text' => 'Dear Sir, I am writing to apologize for the inconvenience caused.',
            ]);
        $submit->assertOk();
        $submit->assertJsonPath('data.word_count', 11);

        $this->assertDatabaseHas('practice_writing_submissions', [
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
        ]);
    }

    public function test_submit_rejects_already_submitted(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", ['text' => 'Hello.'])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", ['text' => 'Again.'])
            ->assertStatus(422);
    }

    private function loginLearner(): string
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        return $this->tokenFor($user);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }
}
