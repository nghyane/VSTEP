<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Practice;

use App\Enums\Role;
use App\Models\PracticeReadingExercise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminReadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_create_exercise_part_4(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/reading/exercises', [
                'slug' => 'sample-reading-1',
                'title' => 'Sample reading',
                'part' => 4,
                'passage' => 'Lorem ipsum dolor sit amet.',
                'estimated_minutes' => 15,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.part', 4);
    }

    public function test_create_question_and_show_returns_correct_index(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $exercise = PracticeReadingExercise::create([
            'slug' => 'x', 'title' => 'X', 'part' => 1,
            'passage' => 'P', 'estimated_minutes' => 5, 'is_published' => false,
        ]);

        $token = JWTAuth::fromUser($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/practice/reading/exercises/{$exercise->id}/questions", [
                'question' => 'What is the main idea?',
                'options' => ['A', 'B', 'C', 'D'],
                'correct_index' => 1,
                'explanation' => 'B is correct.',
            ])->assertCreated();

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/practice/reading/exercises/{$exercise->id}");

        $res->assertOk();
        $this->assertSame(1, $res->json('data.questions.0.correct_index'));
    }
}
