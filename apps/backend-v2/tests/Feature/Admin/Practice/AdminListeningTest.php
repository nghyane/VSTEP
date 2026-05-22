<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Practice;

use App\Enums\Role;
use App\Models\PracticeListeningExercise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminListeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_cannot_access(): void
    {
        $user = User::factory()->create(['role' => Role::Learner]);
        $token = JWTAuth::fromUser($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/practice/listening/exercises')
            ->assertStatus(403);
    }

    public function test_staff_create_exercise(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/listening/exercises', [
                'slug' => 'sample-listening-1',
                'title' => 'Sample 1',
                'part' => 1,
                'audio_url' => 'r2/audio.mp3',
                'transcript' => 'Hello world.',
                'estimated_minutes' => 10,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.slug', 'sample-listening-1');
        $res->assertJsonPath('data.is_published', false);
    }

    public function test_staff_create_question_with_4_options(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $exercise = PracticeListeningExercise::create([
            'slug' => 'x', 'title' => 'X', 'part' => 1,
            'transcript' => 'T', 'estimated_minutes' => 5, 'is_published' => false,
        ]);

        $token = JWTAuth::fromUser($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/listening/exercises/{$exercise->id}/questions", [
                'question' => 'What did the speaker say?',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 2,
                'explanation' => 'Why C is correct.',
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.correct_index', 2);
    }

    public function test_question_rejects_3_options(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $exercise = PracticeListeningExercise::create([
            'slug' => 'y', 'title' => 'Y', 'part' => 1,
            'transcript' => 'T', 'estimated_minutes' => 5, 'is_published' => false,
        ]);

        $token = JWTAuth::fromUser($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/listening/exercises/{$exercise->id}/questions", [
                'question' => 'Q?',
                'options' => ['A', 'B', 'C'],
                'correct_index' => 0,
                'explanation' => 'x',
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['options']);
    }

    public function test_publish_toggle(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $exercise = PracticeListeningExercise::create([
            'slug' => 'z', 'title' => 'Z', 'part' => 1,
            'transcript' => 'T', 'estimated_minutes' => 5, 'is_published' => false,
        ]);

        $token = JWTAuth::fromUser($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/listening/exercises/{$exercise->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.is_published', true);
    }
}
