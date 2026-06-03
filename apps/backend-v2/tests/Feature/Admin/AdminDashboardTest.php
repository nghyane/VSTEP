<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentJob;
use App\Models\AssessmentRubric;
use App\Models\Exam;
use App\Models\GrammarPoint;
use App\Models\Profile;
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

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $rubric = AssessmentRubric::query()->where('task_type', AssessmentTaskType::WritingTask2Essay)->firstOrFail();
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => AssessmentTaskType::WritingTask2Essay,
            'source_type' => AssessmentSourceType::Practice,
            'source_id' => '00000000-0000-0000-0000-000000000001',
            'prompt' => [],
            'response_payload' => [],
            'submitted_at' => now(),
        ]);
        AssessmentJob::create([
            'attempt_id' => $attempt->id,
            'status' => AssessmentJobStatus::Ready,
            'completed_at' => now(),
        ]);
        AssessmentJob::create([
            'attempt_id' => AssessmentAttempt::create([
                'profile_id' => $profile->id,
                'rubric_id' => $rubric->id,
                'skill' => AssessmentSkill::Writing,
                'task_type' => AssessmentTaskType::WritingTask2Essay,
                'source_type' => AssessmentSourceType::Practice,
                'source_id' => '00000000-0000-0000-0000-000000000002',
                'prompt' => [],
                'response_payload' => [],
                'submitted_at' => now(),
            ])->id,
            'status' => AssessmentJobStatus::Pending,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/stats');

        $response->assertOk()
            ->assertJsonPath('data.users_total', fn ($v) => $v >= 2)
            ->assertJsonPath('data.exams_total', fn ($v) => $v >= 2)
            ->assertJsonPath('data.exams_published', fn ($v) => $v >= 1)
            ->assertJsonPath('data.vocab_topics', fn ($v) => $v >= 1)
            ->assertJsonPath('data.grammar_points', fn ($v) => $v >= 1)
            ->assertJsonPath('data.grading_done_today', fn ($v) => $v >= 1)
            ->assertJsonPath('data.grading_pending', fn ($v) => $v >= 1)
            ->assertJsonPath('data.grading_failed', fn ($v) => is_int($v));
    }

    public function test_alerts_detects_failed_assessment_jobs(): void
    {
        $token = $this->actingAsAdmin();

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $rubric = AssessmentRubric::query()->where('task_type', AssessmentTaskType::WritingTask2Essay)->firstOrFail();
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => AssessmentTaskType::WritingTask2Essay,
            'source_type' => AssessmentSourceType::Practice,
            'source_id' => '00000000-0000-0000-0000-000000000001',
            'prompt' => [],
            'response_payload' => [],
            'submitted_at' => now(),
        ]);
        AssessmentJob::create([
            'attempt_id' => $attempt->id,
            'status' => AssessmentJobStatus::Failed,
            'last_error' => 'Demo failure',
        ]);

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
