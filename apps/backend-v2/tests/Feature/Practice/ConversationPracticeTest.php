<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Enums\CoinTransactionType;
use App\Models\PracticeSpeakingConversationSession;
use App\Models\PracticeSpeakingScenario;
use App\Models\Profile;
use App\Models\User;
use App\Services\WalletService;
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

    public function test_unpublished_scenario_is_not_accessible(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario(['is_published' => false]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/scenarios/{$scenario->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertNotFound();
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

    public function test_start_session_ends_active_session_and_creates_new(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        // First session
        $first = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $firstSessionId = $first->json('data.session_id');

        // Second call always ends the active session and creates a new one.
        $second = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $secondSessionId = $second->json('data.session_id');

        $this->assertNotEquals($firstSessionId, $secondSessionId);
        $this->assertFalse($second->json('data.resumed'));

        // Old session is ended.
        $session = PracticeSpeakingConversationSession::find($firstSessionId);
        $this->assertSame('ended', $session->status->value);
        $this->assertNotNull($session->ended_at);
    }

    public function test_old_active_session_auto_ends_and_creates_new(): void
    {
        ['token' => $token] = $this->actingAsLearner();
        $scenario = $this->createScenario();

        // First session
        $first = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $firstSessionId = $first->json('data.session_id');

        // Even a recent active session is ended when starting again.
        PracticeSpeakingConversationSession::query()
            ->whereKey($firstSessionId)
            ->update(['started_at' => now()->subMinutes(5)]);

        // Second call on active session → auto-ends old, creates new.
        $second = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);
        $secondSessionId = $second->json('data.session_id');

        // New session created.
        $this->assertNotEquals($firstSessionId, $secondSessionId);
        $this->assertFalse($second->json('data.resumed'));

        // Old session ended with complete data.
        $oldSession = PracticeSpeakingConversationSession::find($firstSessionId);
        $this->assertSame('ended', $oldSession->status->value);
        $this->assertNotNull($oldSession->ended_at);
        $this->assertNotNull($oldSession->duration_seconds);
        $this->assertGreaterThan(0, $oldSession->duration_seconds);
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
        ['token' => $token, 'profile' => $profile] = $this->actingAsLearner();
        $this->app->make(WalletService::class)->credit($profile, 10, CoinTransactionType::AdminGrant);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/pronunciation-review', [
                'original' => 'Hello world.',
                'transcript' => 'Hello world.',
            ])
            ->assertOk()
            ->assertJsonPath('data.pronunciation', 'Phát âm tốt');

        $this->assertDatabaseHas('coin_transactions', [
            'profile_id' => $profile->id,
            'type' => CoinTransactionType::PracticeFeedback->value,
            'delta' => -1,
        ]);
    }

    public function test_conversation_review_charges_feedback_cost(): void
    {
        ['token' => $token, 'profile' => $profile] = $this->actingAsLearner();
        $this->app->make(WalletService::class)->credit($profile, 10, CoinTransactionType::AdminGrant);
        $scenario = $this->createScenario();

        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/conversations', ['scenario_id' => $scenario->id])
            ->assertStatus(201);

        $sessionId = $start->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/conversations/{$sessionId}/review")
            ->assertOk()
            ->assertJsonPath('data.strengths.0', 'Good vocabulary usage');

        $this->assertDatabaseHas('coin_transactions', [
            'profile_id' => $profile->id,
            'type' => CoinTransactionType::PracticeFeedback->value,
            'delta' => -1,
        ]);
    }
}
