<?php

declare(strict_types=1);

namespace Tests\Feature\Vocab;

use App\Enums\SrsStateKind;
use App\Models\Profile;
use App\Models\ProfileVocabSrsState;
use App\Models\User;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VocabSrsFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_topics_returns_published_only(): void
    {
        VocabTopic::factory()->count(2)->create(['is_published' => true]);
        VocabTopic::factory()->create(['is_published' => false]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/vocab/topics');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_topic_detail_includes_words_with_new_state(): void
    {
        $topic = VocabTopic::factory()->create();
        VocabWord::factory()->count(3)->create(['topic_id' => $topic->id]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/vocab/topics/{$topic->id}");

        $response->assertOk();
        $response->assertJsonCount(3, 'data.words');
        $response->assertJsonPath('data.words.0.state.kind', 'new');
    }

    public function test_review_rating_good_creates_srs_state(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $topic = VocabTopic::factory()->create();
        $word = VocabWord::factory()->create(['topic_id' => $topic->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/vocab/srs/review', [
                'word_id' => $word->id,
                'rating' => 3,
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.state.kind', 'learning');

        $state = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('word_id', $word->id)
            ->first();
        $this->assertNotNull($state);
        $this->assertSame(SrsStateKind::Learning, $state->state_kind);

        $this->assertDatabaseHas('practice_vocab_reviews', [
            'profile_id' => $profile->id,
            'word_id' => $word->id,
            'rating' => 3,
        ]);
    }

    public function test_multiple_reviews_progress_to_review_state(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $word = VocabWord::factory()->create();

        $token = $this->tokenFor($user);

        // new → good → learning(1) → good → review
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/vocab/srs/review', ['word_id' => $word->id, 'rating' => 3])
            ->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/vocab/srs/review', ['word_id' => $word->id, 'rating' => 3])
            ->assertJsonPath('data.state.kind', 'review');

        $state = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('word_id', $word->id)
            ->first();
        $this->assertSame(SrsStateKind::Review, $state->state_kind);
        $this->assertSame(1, $state->interval_days);
    }

    public function test_queue_returns_due_words(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $word1 = VocabWord::factory()->create();
        $word2 = VocabWord::factory()->create();

        // Manually insert due state for word1 (overdue), word2 (future)
        ProfileVocabSrsState::query()->insert([
            'profile_id' => $profile->id,
            'word_id' => $word1->id,
            'state_kind' => 'learning',
            'due_at' => now()->subMinutes(10)->format('Y-m-d H:i:s'),
            'interval_days' => null,
            'ease_factor' => null,
            'remaining_steps' => 1,
            'lapses' => 0,
            'review_interval_days' => null,
            'review_ease_factor' => null,
            'updated_at' => now()->format('Y-m-d H:i:s'),
        ]);
        ProfileVocabSrsState::query()->insert([
            'profile_id' => $profile->id,
            'word_id' => $word2->id,
            'state_kind' => 'review',
            'due_at' => now()->addDays(5)->format('Y-m-d H:i:s'),
            'interval_days' => 5,
            'ease_factor' => 2.5,
            'remaining_steps' => null,
            'lapses' => 0,
            'review_interval_days' => null,
            'review_ease_factor' => null,
            'updated_at' => now()->format('Y-m-d H:i:s'),
        ]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/vocab/srs/queue');

        $response->assertOk();
        $response->assertJsonPath('data.learning_count', 1);
        $response->assertJsonCount(1, 'data.items');
        $response->assertJsonPath('data.items.0.word.id', $word1->id);
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
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
