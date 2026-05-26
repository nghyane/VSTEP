<?php

declare(strict_types=1);

namespace Tests\Feature\Validation;

use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use App\Models\SpeakingGradingResult;
use App\Models\User;
use App\Services\Grading\GradingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class VstepSpeakingValidationTest extends TestCase
{
    use RefreshDatabase;

    private GradingService $grading;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grading = $this->app->make(GradingService::class);
    }

    public function test_speaking_pipeline_returns_valid_scores(): void
    {
        $result = $this->gradeThroughPipeline();

        $this->assertNotNull($result);
        $this->assertTrue($result->overall_band >= 0 && $result->overall_band <= 10);

        foreach (['grammar', 'vocabulary', 'pronunciation', 'fluency', 'discourse_management'] as $key) {
            $this->assertArrayHasKey($key, $result->rubric_scores);
            $this->assertGreaterThanOrEqual(1.0, $result->rubric_scores[$key]);
            $this->assertLessThanOrEqual(10.0, $result->rubric_scores[$key]);
        }

        $this->assertNotEmpty($result->transcript);
    }

    public function test_speaking_all_five_criteria_computed(): void
    {
        $result = $this->gradeThroughPipeline();

        $scores = $result->rubric_scores;
        // Grammar: SyntaxAnalyzer on "This is a test transcript" → 0 types → range=5, accuracy=7
        // (5 + 7) / 2 = 6.0
        $this->assertEquals(6.0, $scores['grammar']);

        // Vocabulary: unique_ratio high for short text → bonus applies
        $this->assertGreaterThanOrEqual(3.0, $scores['vocabulary']);

        // Pronunciation: Fake has overall=7.5 from pronunciation assessment
        $this->assertEquals(7.5, $scores['pronunciation']);

        // Fluency: 72 wpm, 1 pause in 6 words → 16.7% → penalty 1
        $this->assertGreaterThanOrEqual(1.0, $scores['fluency']);

        // Discourse: 0 linking words, 0 variety → base 1
        $this->assertEquals(1.0, $scores['discourse_management']);
    }

    public function test_speaking_pipeline_versioning(): void
    {
        $result1 = $this->gradeThroughPipeline();

        // Re-grade same submission
        $submission = PracticeSpeakingSubmission::first();
        $this->grading->enqueue('practice_speaking', $submission->id);

        $results = SpeakingGradingResult::query()
            ->where('submission_type', 'practice_speaking')
            ->where('submission_id', $submission->id)
            ->orderBy('version')
            ->get();

        $this->assertCount(2, $results);
        $this->assertFalse($results[0]->is_active);
        $this->assertTrue($results[1]->is_active);
        $this->assertSame(2, $results[1]->version);
    }

    private function gradeThroughPipeline(): SpeakingGradingResult
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $task = PracticeSpeakingTask::factory()->create();
        $sessionId = Str::uuid()->toString();

        DB::table('practice_sessions')->insert([
            'id' => $sessionId,
            'profile_id' => $profile->id,
            'module' => 'speaking',
            'content_ref_type' => 'practice_speaking_task',
            'content_ref_id' => $task->id,
            'started_at' => now(),
            'ended_at' => now(),
            'duration_seconds' => 60,
        ]);

        $submissionId = Str::uuid()->toString();
        DB::table('practice_speaking_submissions')->insert([
            'id' => $submissionId,
            'session_id' => $sessionId,
            'profile_id' => $profile->id,
            'task_ref_type' => 'practice_speaking_task',
            'task_ref_id' => $task->id,
            'audio_url' => 'r2://test-audio.webm',
            'duration_seconds' => 30,
            'submitted_at' => now(),
        ]);

        $submission = PracticeSpeakingSubmission::query()->find($submissionId);
        $this->grading->enqueue('practice_speaking', $submission->id);

        return SpeakingGradingResult::query()
            ->where('submission_type', 'practice_speaking')
            ->where('submission_id', $submissionId)
            ->where('is_active', true)
            ->first();
    }
}
