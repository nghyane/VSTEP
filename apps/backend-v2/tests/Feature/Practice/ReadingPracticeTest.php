<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReadingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_reading_submit_scores_correctly(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $exercise = PracticeReadingExercise::factory()->create();
        $q1 = PracticeReadingQuestion::factory()->create([
            'exercise_id' => $exercise->id,
            'correct_index' => 2,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/reading/sessions', ['exercise_id' => $exercise->id])
            ->json('data.id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/reading/sessions/{$sessionId}/submit", [
                'answers' => [['question_id' => $q1->id, 'selected_index' => 2]],
            ]);

        $submit->assertOk();
        $submit->assertJsonPath('data.score', 1);
        $submit->assertJsonPath('data.total', 1);
        $submit->assertJsonPath('data.session.module', 'reading');
    }

    public function test_unknown_skill_returns_404(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/writing/exercises')
            ->assertStatus(404);
    }
}
