<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ShadowingProgressTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_profile_can_store_and_list_shadowing_progress_grouped_by_lesson(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->loginToken($user);

        $storeResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/shadowing/progress', [
                'lesson_id' => 'lesson-a',
                'segment_index' => 2,
                'accuracy_percent' => 87,
            ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('data.lesson_id', 'lesson-a')
            ->assertJsonPath('data.segment_index', 2)
            ->assertJsonPath('data.accuracy_percent', 87);

        $listResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/shadowing/progress');

        $listResponse->assertOk()
            ->assertJsonPath('data.lesson-a.0.segment_index', 2)
            ->assertJsonPath('data.lesson-a.0.accuracy_percent', 87);
    }

    private function loginToken(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();

        return (string) $response->json('data.access_token');
    }
}
