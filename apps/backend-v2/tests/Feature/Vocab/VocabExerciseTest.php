<?php

declare(strict_types=1);

namespace Tests\Feature\Vocab;

use App\Models\Profile;
use App\Models\User;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VocabExerciseTest extends TestCase
{
    use RefreshDatabase;

    public function test_mcq_correct_answer_logged(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $exercise = VocabExercise::factory()
            ->mcq(correctIndex: 2)
            ->create(['topic_id' => VocabTopic::factory()->create()->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/vocab/exercises/{$exercise->id}/attempt", [
                'answer' => ['selected_index' => 2],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', true);

        $this->assertDatabaseHas('practice_vocab_exercise_attempts', [
            'profile_id' => $profile->id,
            'exercise_id' => $exercise->id,
            'is_correct' => true,
        ]);
    }

    public function test_mcq_wrong_answer_marked_incorrect(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $exercise = VocabExercise::factory()
            ->mcq(correctIndex: 0)
            ->create(['topic_id' => VocabTopic::factory()->create()->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/vocab/exercises/{$exercise->id}/attempt", [
                'answer' => ['selected_index' => 3],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', false);
    }

    public function test_fill_blank_accepts_any_of_accepted_answers(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $exercise = VocabExercise::factory()
            ->fillBlank(['happy', 'content', 'pleased'])
            ->create(['topic_id' => VocabTopic::factory()->create()->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/vocab/exercises/{$exercise->id}/attempt", [
                'answer' => ['text' => '  Content  '],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', true);
    }

    public function test_word_form_incorrect(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $exercise = VocabExercise::factory()
            ->wordForm('happy', ['happiness'])
            ->create(['topic_id' => VocabTopic::factory()->create()->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/vocab/exercises/{$exercise->id}/attempt", [
                'answer' => ['text' => 'happier'],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', false);
    }

    public function test_topic_detail_hides_correct_index(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $topic = VocabTopic::factory()->create();
        VocabExercise::factory()->mcq(correctIndex: 2)->create(['topic_id' => $topic->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/vocab/topics/{$topic->id}");

        $response->assertOk();
        $this->assertArrayNotHasKey('correct_index', $response->json('data.exercises.0.payload'));
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
