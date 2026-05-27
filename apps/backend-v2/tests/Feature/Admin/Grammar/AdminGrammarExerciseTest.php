<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Grammar;

use App\Enums\Role;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminGrammarExerciseTest extends TestCase
{
    use RefreshDatabase;

    public function test_mcq_requires_4_options(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/exercises", [
                'kind' => 'mcq',
                'explanation' => 'why',
                'payload' => [
                    'prompt' => 'Choose:',
                    'options' => ['A', 'B', 'C'],
                    'correct_index' => 0,
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['payload.options']);
    }

    public function test_error_correction_is_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/exercises", [
                'kind' => 'error_correction',
                'explanation' => 'why',
                'payload' => [
                    'sentence' => 'I has',
                    // missing error_start, error_end, correction
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['kind']);
    }

    public function test_fill_blank_is_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/exercises", [
                'kind' => 'fill_blank',
                'explanation' => 'why',
                'payload' => [
                    'template' => 'He ___ there.',
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['kind']);
    }

    public function test_rewrite_is_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/exercises", [
                'kind' => 'rewrite',
                'explanation' => 'Use exclamation.',
                'payload' => [
                    'instruction' => 'Rewrite as exclamation.',
                    'original' => 'She is tall.',
                    'accepted_answers' => ['How tall she is!'],
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['kind']);
    }

    public function test_strips_extra_payload_keys(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/grammar/points/{$point->id}/exercises", [
                'kind' => 'mcq',
                'explanation' => 'e',
                'payload' => [
                    'prompt' => 'p',
                    'options' => ['a', 'b', 'c', 'd'],
                    'correct_index' => 1,
                    // rác:
                    'accepted_answers' => ['x'],
                    'instruction' => 'rác',
                ],
            ]);

        $res->assertCreated();
        $exercise = GrammarExercise::query()->where('grammar_point_id', $point->id)->first();
        $this->assertNotNull($exercise);
        $this->assertSame(['prompt', 'options', 'correct_index'], array_keys($exercise->payload));
    }

    public function test_show_point_exposes_correct_index(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $point = GrammarPoint::factory()->create();
        GrammarExercise::factory()->mcq(correctIndex: 2)->create(['grammar_point_id' => $point->id]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/grammar/points/{$point->id}");

        $res->assertOk();
        $this->assertSame(2, $res->json('data.exercises.0.payload.correct_index'));
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
