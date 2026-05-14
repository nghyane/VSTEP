<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Vocab;

use App\Enums\Role;
use App\Models\User;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminVocabExerciseTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_mcq_exercise_requires_4_options(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/exercises", [
                'kind' => 'mcq',
                'explanation' => 'why',
                'payload' => [
                    'prompt' => 'Q?',
                    'options' => ['A', 'B', 'C'], // missing 4th
                    'correct_index' => 0,
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['payload.options']);
    }

    public function test_create_mcq_exercise_succeeds(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/exercises", [
                'kind' => 'mcq',
                'explanation' => 'A is the synonym.',
                'payload' => [
                    'prompt' => 'Choose synonym of "happy"',
                    'options' => ['glad', 'sad', 'angry', 'tired'],
                    'correct_index' => 0,
                ],
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.kind', 'mcq');
        $res->assertJsonPath('data.payload.correct_index', 0);
        $this->assertDatabaseHas('vocab_exercises', ['topic_id' => $topic->id, 'kind' => 'mcq']);
    }

    public function test_create_fill_blank_requires_accepted_answers(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/exercises", [
                'kind' => 'fill_blank',
                'explanation' => 'why',
                'payload' => [
                    'sentence' => 'She is ___',
                    // missing accepted_answers
                ],
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['payload.accepted_answers']);
    }

    public function test_strip_unused_payload_keys_for_kind(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/exercises", [
                'kind' => 'mcq',
                'explanation' => 'e',
                'payload' => [
                    'prompt' => 'p',
                    'options' => ['a', 'b', 'c', 'd'],
                    'correct_index' => 1,
                    // extra rác:
                    'accepted_answers' => ['x'],
                    'instruction' => 'rác',
                ],
            ]);

        $res->assertCreated();
        $exercise = VocabExercise::query()->where('topic_id', $topic->id)->first();
        $this->assertNotNull($exercise);
        $this->assertSame(['prompt', 'options', 'correct_index'], array_keys($exercise->payload));
    }

    public function test_admin_exercise_response_includes_correct_index(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();
        VocabExercise::factory()->mcq(correctIndex: 3)->create(['topic_id' => $topic->id]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/vocab/topics/{$topic->id}");

        $res->assertOk();
        $this->assertSame(3, $res->json('data.exercises.0.payload.correct_index'));
    }

    public function test_reorder_exercises(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $topic = VocabTopic::factory()->create();
        $e1 = VocabExercise::factory()->mcq()->create(['topic_id' => $topic->id, 'display_order' => 0]);
        $e2 = VocabExercise::factory()->mcq()->create(['topic_id' => $topic->id, 'display_order' => 1]);
        $e3 = VocabExercise::factory()->mcq()->create(['topic_id' => $topic->id, 'display_order' => 2]);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/vocab/topics/{$topic->id}/exercises/reorder", [
                'ids' => [$e3->id, $e1->id, $e2->id],
            ])
            ->assertNoContent();

        $this->assertSame(0, $e3->fresh()->display_order);
        $this->assertSame(1, $e1->fresh()->display_order);
        $this->assertSame(2, $e2->fresh()->display_order);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
