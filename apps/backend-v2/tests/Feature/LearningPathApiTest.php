<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class LearningPathApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_learning_path_requires_auth(): void
    {
        $this->getJson('/api/v1/learning-path')->assertStatus(401);
    }

    public function test_learning_path_returns_data(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $token = $this->tokenFor($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/learning-path');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'current_level',
                'target_level',
                'days_remaining',
                'skills',
            ],
        ]);
    }

    public function test_risk_students_requires_auth(): void
    {
        $this->getJson('/api/v1/courses/non-existent/risk-students')->assertStatus(401);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
