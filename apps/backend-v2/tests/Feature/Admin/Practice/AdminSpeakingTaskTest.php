<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Practice;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminSpeakingTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_task_part_1_social(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/speaking-tasks', [
                'slug' => 'social-family',
                'title' => 'Social interaction — family',
                'part' => 1,
                'task_type' => 'social',
                'content' => [
                    'topics' => [
                        ['name' => 'family', 'questions' => ['Tell me about your family.']],
                    ],
                ],
                'estimated_minutes' => 3,
                'speaking_seconds' => 45,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.task_type', 'social');
        $this->assertNotEmpty($res->json('data.content.topics'));
    }

    public function test_invalid_task_type_rejected(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $token = JWTAuth::fromUser($staff);

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/practice/speaking-tasks', [
                'slug' => 'x', 'title' => 'X', 'part' => 1,
                'task_type' => 'wrong-type',
                'content' => ['a' => 1],
                'estimated_minutes' => 3,
                'speaking_seconds' => 45,
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['task_type']);
    }
}
