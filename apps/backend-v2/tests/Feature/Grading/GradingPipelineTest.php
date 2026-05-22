<?php

declare(strict_types=1);

namespace Tests\Feature\Grading;

use App\Enums\GradingJobStatus;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\User;
use App\Models\WritingGradingResult;
use App\Services\Grading\GradingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradingPipelineTest extends TestCase
{
    use RefreshDatabase;

    public function test_writing_grading_creates_job_and_result(): void
    {
        $service = $this->app->make(GradingService::class);
        $submission = $this->createWritingSubmission();

        $job = $service->enqueue('practice_writing', $submission->id);

        $this->assertSame(GradingJobStatus::Ready, $job->status);
        $this->assertSame(1, $job->attempts);

        $result = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $submission->id)
            ->where('is_active', true)
            ->first();

        $this->assertNotNull($result);
        $this->assertSame(1, $result->version);
        $this->assertTrue($result->overall_band >= 0);
        $this->assertIsArray($result->rubric_scores);
        $this->assertIsArray($result->strengths);
    }

    public function test_regrade_creates_new_version_deactivates_old(): void
    {
        $service = $this->app->make(GradingService::class);
        $submission = $this->createWritingSubmission();

        // First grading completes synchronously (queue=sync) → job becomes Ready.
        $service->enqueue('practice_writing', $submission->id);

        // Re-enqueue is only allowed once active job finished — partial unique index
        // blocks duplicate pending/processing jobs. After Ready, new enqueue allowed.
        $service->enqueue('practice_writing', $submission->id);

        $results = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $submission->id)
            ->orderBy('version')
            ->get();

        $this->assertCount(2, $results);
        $this->assertFalse($results[0]->is_active);
        $this->assertTrue($results[1]->is_active);
        $this->assertSame(2, $results[1]->version);
    }

    public function test_writing_submit_triggers_grading(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');

        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id])
            ->json('data.session_id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", [
                'text' => 'Dear Sir, I am writing to apologize.',
            ]);
        $submit->assertOk();

        $submissionId = $submit->json('data.submission_id');
        $this->assertDatabaseHas('grading_jobs', [
            'submission_type' => 'practice_writing',
            'submission_id' => $submissionId,
            'status' => GradingJobStatus::Ready->value,
        ]);
        $this->assertDatabaseHas('writing_grading_results', [
            'submission_type' => 'practice_writing',
            'submission_id' => $submissionId,
            'is_active' => true,
        ]);
    }

    public function test_grading_job_endpoint(): void
    {
        $service = $this->app->make(GradingService::class);
        $submission = $this->createWritingSubmission();
        $job = $service->enqueue('practice_writing', $submission->id);

        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/grading/jobs/{$job->id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'ready');
    }

    private function createWritingSubmission(): PracticeWritingSubmission
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();
        $session = PracticeSession::create([
            'profile_id' => $profile->id,
            'module' => 'writing',
            'content_ref_type' => 'practice_writing_prompt',
            'content_ref_id' => $prompt->id,
            'started_at' => now(),
            'ended_at' => now(),
            'duration_seconds' => 60,
        ]);

        return PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
            'text' => 'Dear Sir, I am writing to apologize for the inconvenience.',
            'word_count' => 10,
            'submitted_at' => now(),
        ]);
    }
}
