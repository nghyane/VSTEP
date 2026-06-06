<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Models\Profile;
use App\Models\User;
use App\Services\TokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListeningPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_exercises_filter_by_part(): void
    {
        PracticeListeningExercise::factory()->create(['part' => 1]);
        PracticeListeningExercise::factory()->create(['part' => 2]);
        PracticeListeningExercise::factory()->create(['part' => 3]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/listening/exercises?part=2');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.part', 2);
    }

    public function test_show_exercise_hides_correct_index(): void
    {
        $exercise = PracticeListeningExercise::factory()->create();
        PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'correct_index' => 2,
        ]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/listening/exercises/{$exercise->id}");

        $response->assertOk();
        $this->assertArrayNotHasKey('correct_index', $response->json('data.questions.0'));
        $this->assertArrayNotHasKey('explanation', $response->json('data.questions.0'));
        $this->assertSame($exercise->audio_url, $response->json('data.exercise.audio_url'));
        $this->assertStringStartsWith('audio/listening/', $response->json('data.exercise.audio_url'));
    }

    public function test_unpublished_exercise_is_not_accessible(): void
    {
        $exercise = PracticeListeningExercise::factory()->create(['is_published' => false]);
        PracticeListeningQuestion::factory()->create(['exercise_id' => $exercise->id]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/listening/exercises/{$exercise->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/listening/sessions', ['exercise_id' => $exercise->id])
            ->assertNotFound();
    }

    public function test_full_mcq_flow_start_submit(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $exercise = PracticeListeningExercise::factory()->create();
        $q1 = PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'display_order' => 0,
            'correct_index' => 0,
        ]);
        $q2 = PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'display_order' => 1,
            'correct_index' => 1,
        ]);

        $token = $this->tokenFor($user);

        // Start
        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/listening/sessions', [
                'exercise_id' => $exercise->id,
            ]);
        $start->assertCreated();
        $sessionId = $start->json('data.id');

        // Submit: 1 correct, 1 wrong
        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/listening/sessions/{$sessionId}/submit", [
                'answers' => [
                    ['question_id' => $q1->id, 'selected_index' => 0],
                    ['question_id' => $q2->id, 'selected_index' => 3],
                ],
            ]);
        $submit->assertOk();
        $submit->assertJsonPath('data.score', 1);
        $submit->assertJsonPath('data.total', 2);
        $submit->assertJsonPath('data.items.0.is_correct', true);
        $submit->assertJsonPath('data.items.1.is_correct', false);

        // Session ended_at set
        $submit->assertJsonPath('data.session.module', 'listening');
    }

    public function test_submit_uses_active_profile_from_token_when_user_row_is_not_persisted(): void
    {
        $user = User::factory()->create(['active_profile_id' => null]);
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $exercise = PracticeListeningExercise::factory()->create();
        $question = PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'correct_index' => 0,
        ]);
        $token = app(TokenService::class)->issueAccessToken($user, $profile);

        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/listening/sessions', [
                'exercise_id' => $exercise->id,
            ]);
        $start->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/listening/sessions/{$start->json('data.id')}/submit", [
                'answers' => [['question_id' => $question->id, 'selected_index' => 0]],
            ])
            ->assertOk()
            ->assertJsonPath('data.score', 1);
    }

    public function test_submit_rejects_already_submitted(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $exercise = PracticeListeningExercise::factory()->create();
        $question = PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'correct_index' => 0,
        ]);

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/listening/sessions', ['exercise_id' => $exercise->id])
            ->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/listening/sessions/{$sessionId}/submit", [
                'answers' => [['question_id' => $question->id, 'selected_index' => 0]],
            ])->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/listening/sessions/{$sessionId}/submit", [
                'answers' => [['question_id' => $question->id, 'selected_index' => 0]],
            ])->assertStatus(422);
    }

    public function test_cannot_submit_other_profile_session(): void
    {
        $userA = User::factory()->create();
        Profile::factory()->initial()->forAccount($userA)->create();
        $exercise = PracticeListeningExercise::factory()->create();
        $question = PracticeListeningQuestion::factory()->create([
            'exercise_id' => $exercise->id,
        ]);

        $tokenA = $this->tokenFor($userA);
        $sessionId = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/v1/practice/listening/sessions', ['exercise_id' => $exercise->id])
            ->json('data.id');

        $userB = User::factory()->create();
        Profile::factory()->initial()->forAccount($userB)->create();
        $tokenB = $this->tokenFor($userB);

        $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->postJson("/api/v1/practice/listening/sessions/{$sessionId}/submit", [
                'answers' => [['question_id' => $question->id, 'selected_index' => 0]],
            ])->assertStatus(403);
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
