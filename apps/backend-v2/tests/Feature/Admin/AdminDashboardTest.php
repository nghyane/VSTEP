<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\Exam;
use App\Models\GradingJob;
use App\Models\GrammarPoint;
use App\Models\User;
use App\Models\VocabTopic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): string
    {
        $user = User::factory()->admin()->create();

        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }

    public function test_stats_returns_aggregate_counts(): void
    {
        $token = $this->actingAsAdmin();

        User::factory()->create();
        Exam::factory()->published()->create();
        Exam::factory()->draft()->create();
        VocabTopic::factory()->create();
        GrammarPoint::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/stats');

        $response->assertOk()
            ->assertJsonPath('data.users_total', fn ($v) => $v >= 2)
            ->assertJsonPath('data.exams_total', fn ($v) => $v >= 2)
            ->assertJsonPath('data.exams_published', fn ($v) => $v >= 1)
            ->assertJsonPath('data.vocab_topics', fn ($v) => $v >= 1)
            ->assertJsonPath('data.grammar_points', fn ($v) => $v >= 1);
    }

    public function test_alerts_detects_failed_grading_jobs(): void
    {
        $token = $this->actingAsAdmin();

        GradingJob::factory()->failed()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/alerts');

        $response->assertOk()
            ->assertJsonPath('data.0.type', 'error');
    }

    public function test_content_status_classes_by_type(): void
    {
        $token = $this->actingAsAdmin();

        Exam::factory()->published()->create();
        VocabTopic::factory()->create();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/content-status');

        $response->assertOk()
            ->assertJsonFragment(['type' => 'Đề thi'])
            ->assertJsonFragment(['type' => 'Chủ đề từ vựng']);
    }

    public function test_recent_activity_returns_feed(): void
    {
        $token = $this->actingAsAdmin();

        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/recent-activity');

        $response->assertOk();
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_dashboard_endpoints_require_staff_role(): void
    {
        $user = User::factory()->create();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/stats')
            ->assertForbidden();
    }
}
