<?php

declare(strict_types=1);

namespace Tests\Feature\Grammar;

use App\Enums\MasteryLevel;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\Profile;
use App\Models\ProfileGrammarMastery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GrammarPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_points_returns_published_only(): void
    {
        GrammarPoint::factory()->count(2)->create(['is_published' => true]);
        GrammarPoint::factory()->create(['is_published' => false]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/grammar/points');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_point_detail_includes_children_and_mastery_null(): void
    {
        $point = GrammarPoint::factory()->create();
        GrammarExercise::factory()->mcq()->create(['grammar_point_id' => $point->id]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grammar/points/{$point->id}");

        $response->assertOk();
        $response->assertJsonPath('data.mastery', null);
        $response->assertJsonCount(1, 'data.exercises');
    }

    public function test_unpublished_point_detail_and_exercises_are_not_accessible(): void
    {
        $point = GrammarPoint::factory()->create(['is_published' => false]);
        $exercise = GrammarExercise::factory()->mcq()->create(['grammar_point_id' => $point->id]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grammar/points/{$point->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                'answer' => ['selected_index' => 0],
            ])
            ->assertNotFound();
    }

    public function test_mcq_correct_updates_mastery(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()->mcq(correctIndex: 1)
            ->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                'answer' => ['selected_index' => 1],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', true);
        $response->assertJsonPath('data.mastery.attempts', 1);
        $response->assertJsonPath('data.mastery.correct', 1);
        $response->assertJsonPath('data.mastery.computed_level', 'learning');

        $this->assertDatabaseHas('practice_grammar_attempts', [
            'profile_id' => $profile->id,
            'exercise_id' => $exercise->id,
            'is_correct' => true,
        ]);
    }

    public function test_mastery_requires_two_distinct_correct_exercises(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercises = GrammarExercise::factory()->count(2)->mcq(correctIndex: 2)
            ->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        foreach ($exercises as $exercise) {
            $this->withHeader('Authorization', "Bearer {$token}")
                ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                    'answer' => ['selected_index' => 2],
                ])->assertOk();
        }

        $mastery = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $point->id)
            ->first();

        $this->assertSame(2, $mastery->attempts);
        $this->assertSame(2, $mastery->correct);
        $this->assertSame(MasteryLevel::Mastered, $mastery->computed_level);
    }

    public function test_repeating_one_exercise_remains_practicing(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()->mcq(correctIndex: 2)
            ->create(['grammar_point_id' => $point->id]);
        $token = $this->tokenFor($user);

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withHeader('Authorization', "Bearer {$token}")
                ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                    'answer' => ['selected_index' => 2],
                ])->assertOk();
        }

        $mastery = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $point->id)
            ->firstOrFail();

        $this->assertSame(MasteryLevel::Practicing, $mastery->computed_level);
    }

    public function test_inactive_exercise_is_not_listed_or_attemptable(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()->mcq()
            ->create(['grammar_point_id' => $point->id, 'is_active' => false]);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grammar/points/{$point->id}")
            ->assertOk()
            ->assertJsonCount(0, 'data.exercises');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                'answer' => ['selected_index' => 0],
            ])
            ->assertNotFound();
    }

    public function test_point_detail_hides_correct_fields(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        GrammarExercise::factory()->mcq(correctIndex: 2)->create(['grammar_point_id' => $point->id]);
        GrammarExercise::factory()->mcq(correctIndex: 1)->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grammar/points/{$point->id}");

        $response->assertOk();
        foreach ($response->json('data.exercises') as $ex) {
            $this->assertArrayNotHasKey('correct_index', $ex['payload']);
        }
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
