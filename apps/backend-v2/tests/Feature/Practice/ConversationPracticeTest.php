<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationPracticeTest extends TestCase
{
    use RefreshDatabase;

    private function createScenario(array $overrides = []): PracticeSpeakingScenario
    {
        return PracticeSpeakingScenario::factory()->create(array_merge([
            'is_published' => true,
            'target_vocab' => ['hello', 'good morning'],
        ], $overrides));
    }

    private function actingAsLearner(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->forAccount($user)->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        // Switch to active profile
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/switch-profile', ['profile_id' => $profile->id]);

        return ['token' => $token, 'profile' => $profile];
    }

    public function test_list_scenarios_returns_published_only(): void
    {
        ['token' => $token] = $this->actingAsLearner();

        $published = $this->createScenario(['title' => 'Published']);
        $unpublished = PracticeSpeakingScenario::factory()->create(['title' => 'Draft', 'is_published' => false]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/scenarios');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertContains('Published', $titles);
        $this->assertNotContains('Draft', $titles);
    }

    public function test_show_scenario_returns_details(): void
    {
        ['token' => $token] = $this->actingAsLearner();

        $scenario = $this->createScenario();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/scenarios/{$scenario->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $scenario->id)
            ->assertJsonPath('data.title', $scenario->title);
    }

    public function test_start_and_end_conversation_session(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        // Start session
        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', [
                'scenario_id' => $scenario->id,
            ]);

        $start->assertStatus(201);
        $sessionId = $start->json('data.session_id');
        $this->assertNotEmpty($sessionId);
        $this->assertNotEmpty($start->json('data.turns'));
        $this->assertEquals('ai', $start->json('data.turns.0.role'));

        // End session
        $end = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/conversations/{$sessionId}/end");

        $end->assertOk();
        $this->assertNotNull($end->json('data.session_id'));

        // End session again — should fail
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/conversations/{$sessionId}/end")
            ->assertStatus(409);
    }

    public function test_cannot_start_duplicate_active_session(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        // First session
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);

        // Second session — should fail
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertUnprocessable();
    }

    public function test_conversation_history(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        // Start and immediately end — adds to history
        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $sessionId = $start->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/conversations/{$sessionId}/end");

        $history = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/conversations/history');

        $history->assertOk();
        $this->assertNotEmpty($history->json('data'));
    }

    public function test_submit_turn_requires_active_session(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $sessionId = $start->json('data.session_id');

        // End it first
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/conversations/{$sessionId}/end");

        // Try to submit turn on ended session
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/conversations/{$sessionId}/turn", [
                'text' => 'Hello',
            ])
            ->assertStatus(409);
    }

    public function test_pronunciation_review_renders_ai_prompt_view(): void
    {
        ['token' => $token] = $this->actingAsLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/pronunciation-review', [
                'original' => 'Hello world.',
                'transcript' => 'Hello world.',
            ])
            ->assertOk()
            ->assertJsonPath('data.pronunciation', 'Phát âm tốt');
    }
}
