<?php

declare(strict_types=1);

namespace Tests\Feature\Vocab;

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
        // FSRS new state: kind=new, difficulty=0, stability=0
        $response->assertJsonPath('data.words.0.state.kind', 'new');
        $response->assertJsonPath('data.words.0.state.difficulty', 0);
        $response->assertJsonPath('data.words.0.state.stability', 0);
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
        // FSRS: after first Good, enters learning (has steps)
        $response->assertJsonPath('data.state.kind', 'learning');
        $response->assertJsonPath('data.state.lapses', 0);

        $state = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('word_id', $word->id)
            ->first();
        $this->assertNotNull($state);
        $this->assertGreaterThan(0.0, $state->stability);

        $this->assertDatabaseHas('practice_vocab_reviews', [
            'profile_id' => $profile->id,
            'word_id' => $word->id,
            'rating' => 3,
        ]);
    }

    public function test_multiple_reviews_graduate_to_review(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $word = VocabWord::factory()->create();

        $token = $this->tokenFor($user);

        // First review: new → learning
        $r1 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/vocab/srs/review', ['word_id' => $word->id, 'rating' => 3]);
        $r1->assertOk();
        $r1->assertJsonPath('data.state.kind', 'learning');

        // Second review: learning (1 step left) + Good → review
        $r2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/vocab/srs/review', ['word_id' => $word->id, 'rating' => 3]);
        $r2->assertOk();
        $r2->assertJsonPath('data.state.kind', 'review');
    }

    public function test_queue_returns_due_words(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $word1 = VocabWord::factory()->create();
        $word2 = VocabWord::factory()->create();

        // word1: due (overdue learning), word2: future
        $dueAt = now()->subMinutes(10);
        ProfileVocabSrsState::query()->insert([
            'profile_id' => $profile->id,
            'word_id' => $word1->id,
            'state_kind' => 'learning',
            'difficulty' => 5.0,
            'stability' => 2.0,
            'due_at' => $dueAt,
            'lapses' => 0,
            'remaining_steps' => 1,
            'last_review_at' => now()->subDays(2),
            'updated_at' => now(),
        ]);
        ProfileVocabSrsState::query()->insert([
            'profile_id' => $profile->id,
            'word_id' => $word2->id,
            'state_kind' => 'review',
            'difficulty' => 5.0,
            'stability' => 10.0,
            'due_at' => now()->addDays(5),
            'lapses' => 0,
            'remaining_steps' => 0,
            'last_review_at' => now()->subDays(1),
            'updated_at' => now(),
        ]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/vocab/srs/queue');

        $response->assertOk();
        $responseData = $response->json('data');
        $this->assertCount(1, $responseData['items'], 'Expected 1 item. Got: '.json_encode($responseData));
        $response->assertJsonPath('data.learning_count', 1);
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
