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

    public function test_mastery_progresses_to_mastered_after_five_correct(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()->mcq(correctIndex: 2)
            ->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        for ($i = 0; $i < 5; $i++) {
            $this->withHeader('Authorization', "Bearer {$token}")
                ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                    'answer' => ['selected_index' => 2],
                ])->assertOk();
        }

        $mastery = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $point->id)
            ->first();

        $this->assertSame(5, $mastery->attempts);
        $this->assertSame(5, $mastery->correct);
        $this->assertSame(MasteryLevel::Mastered, $mastery->computed_level);
    }

    public function test_error_correction_validates_correction_text(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()
            ->errorCorrection('I has book.', 'I have a book.')
            ->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                'answer' => ['text' => '  I have a book.  '],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', true);
    }

    public function test_rewrite_with_wrong_answer(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        $exercise = GrammarExercise::factory()
            ->rewrite('She is tall.', ['How tall she is!'])
            ->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/grammar/exercises/{$exercise->id}/attempt", [
                'answer' => ['text' => 'How tall is she'],
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.is_correct', false);
    }

    public function test_point_detail_hides_correct_fields(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $point = GrammarPoint::factory()->create();
        GrammarExercise::factory()->mcq(correctIndex: 2)->create(['grammar_point_id' => $point->id]);
        GrammarExercise::factory()->errorCorrection('X', 'Y')->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grammar/points/{$point->id}");

        $response->assertOk();
        foreach ($response->json('data.exercises') as $ex) {
            $this->assertArrayNotHasKey('correct_index', $ex['payload']);
            $this->assertArrayNotHasKey('correction', $ex['payload']);
            $this->assertArrayNotHasKey('accepted_answers', $ex['payload']);
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
