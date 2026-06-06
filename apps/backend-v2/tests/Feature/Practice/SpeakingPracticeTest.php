<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentEvidence;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\PracticeSession;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SpeakingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_drills_filter_by_level(): void
    {
        // Seeder migration creates drills — count existing B1 + our new one.
        $existingB1 = PracticeSpeakingDrill::query()->where('level', 'B1')->count();
        PracticeSpeakingDrill::factory()->create([
            'level' => 'B1',
            'description' => 'Luyện nhại câu ngắn về tình huống học tập.',
            'is_published' => true,
        ]);
        PracticeSpeakingDrill::factory()->create(['level' => 'B2', 'is_published' => true]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/drills?level=B1')
            ->assertOk()
            ->assertJsonCount($existingB1 + 1, 'data')
            ->assertJsonFragment(['description' => 'Luyện nhại câu ngắn về tình huống học tập.']);
    }

    public function test_drill_session_attempt_flow(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $drill = PracticeSpeakingDrill::factory()->create();
        $sentence = PracticeSpeakingDrillSentence::create([
            'drill_id' => $drill->id, 'display_order' => 0,
            'text' => 'I usually wake up at seven.', 'translation' => 'Tôi thường dậy lúc 7h.',
        ]);

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/drill-sessions', ['exercise_id' => $drill->id])
            ->assertCreated()
            ->json('data.session_id');

        $attempt = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/drill-sessions/{$sessionId}/attempt", [
                'sentence_id' => $sentence->id,
                'mode' => 'dictation',
                'user_text' => 'I usually wake up at seven.',
                'accuracy_percent' => 95,
            ]);
        $attempt->assertOk();
        $attempt->assertJsonPath('data.accuracy_percent', 95);
    }

    public function test_drill_detail_computes_word_count_for_legacy_sentence(): void
    {
        $drill = PracticeSpeakingDrill::factory()->create(['is_published' => true]);
        PracticeSpeakingDrillSentence::create([
            'drill_id' => $drill->id,
            'display_order' => 0,
            'text' => 'I usually wake up at seven.',
            'translation' => 'Tôi thường dậy lúc 7h.',
            'word_count' => 0,
        ]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/drills/{$drill->id}")
            ->assertOk()
            ->assertJsonPath('data.segments.0.word_count', 6);
    }

    public function test_unpublished_drill_is_not_accessible(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $drill = PracticeSpeakingDrill::factory()->create(['is_published' => false]);

        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/drills/{$drill->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/drill-sessions', ['exercise_id' => $drill->id])
            ->assertNotFound();
    }

    public function test_vstep_practice_submit(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $task = PracticeSpeakingTask::factory()->create();
        $profile = Profile::query()->where('account_id', $user->id)->firstOrFail();
        $audioKey = "audio/practice_speaking/{$profile->id}/test.webm";
        Storage::fake('s3');
        Storage::disk('s3')->put($audioKey, 'fake audio');

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/vstep-sessions', ['exercise_id' => $task->id])
            ->assertCreated()
            ->json('data.session_id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/speaking/vstep-sessions/{$sessionId}/submit", [
                'audio_key' => $audioKey,
                'duration_seconds' => 90,
            ]);
        $submit->assertOk();
        $submit->assertJsonPath('data.grading_status', 'pending');

        $this->assertDatabaseHas('practice_speaking_submissions', [
            'session_id' => $sessionId,
            'task_ref_type' => 'practice_speaking_task',
        ]);
        $this->assertDatabaseHas('assessment_attempts', [
            'profile_id' => $profile->id,
            'source_type' => 'practice',
        ]);
        $this->assertDatabaseCount('assessment_jobs', 1);
    }

    public function test_unpublished_vstep_task_is_not_accessible(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $task = PracticeSpeakingTask::factory()->create(['is_published' => false]);

        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/tasks/{$task->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/speaking/vstep-sessions', ['exercise_id' => $task->id])
            ->assertNotFound();
    }

    public function test_speaking_result_returns_diagnostics(): void
    {
        [$user, $submission] = $this->gradedSpeakingSubmission();
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/submissions/{$submission->id}/result")
            ->assertOk()
            ->assertJsonPath('data.overall_band', 6)
            ->assertJsonPath('data.diagnostics.speech.transcript', 'I enjoy learning English every day.')
            ->assertJsonPath('data.diagnostics.speech.speaking_rate', 112.5)
            ->assertJsonPath('data.diagnostics.fluency.pause_count', 2)
            ->assertJsonPath('data.diagnostics.pronunciation.overall', 78)
            ->assertJsonPath('data.diagnostics.content.content_factor', 0.9);
    }

    public function test_speaking_result_marks_missing_diagnostics_as_null(): void
    {
        [$user, $submission] = $this->gradedSpeakingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        AssessmentEvidence::query()
            ->where('attempt_id', $attempt->id)
            ->update(['signals' => [], 'evidence' => []]);
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/speaking/submissions/{$submission->id}/result")
            ->assertOk()
            ->assertJsonPath('data.diagnostics.data_status.vocabulary_metrics_available', false)
            ->assertJsonPath('data.diagnostics.summary.word_count', null)
            ->assertJsonPath('data.diagnostics.summary.total_error_count', null)
            ->assertJsonPath('data.diagnostics.speech.transcript', null)
            ->assertJsonPath('data.diagnostics.speech.speaking_rate', null)
            ->assertJsonPath('data.diagnostics.fluency.pause_count', null)
            ->assertJsonPath('data.diagnostics.pronunciation.overall', null)
            ->assertJsonPath('data.diagnostics.content.content_factor', null)
            ->assertJsonPath('data.diagnostics.cohesion.linking_word_count', null);
    }

    public function test_list_vstep_tasks(): void
    {
        PracticeSpeakingTask::factory()->create(['part' => 1]);
        PracticeSpeakingTask::factory()->create(['part' => 2]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/speaking/tasks')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    private function loginLearner(): string
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        return $this->tokenFor($user);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }

    /** @return array{User, PracticeSpeakingSubmission} */
    private function gradedSpeakingSubmission(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $task = PracticeSpeakingTask::factory()->create(['part' => 1]);
        $session = PracticeSession::factory()->create([
            'profile_id' => $profile->id,
            'module' => 'speaking',
            'content_ref_type' => 'practice_speaking_task',
            'content_ref_id' => $task->id,
        ]);
        $submission = PracticeSpeakingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'task_ref_type' => 'practice_speaking_task',
            'task_ref_id' => $task->id,
            'audio_key' => 'audio/practice_speaking/test.webm',
            'audio_url' => 'https://example.test/audio.webm',
            'duration_seconds' => 32,
            'transcript' => 'I enjoy learning English every day.',
            'submitted_at' => now(),
        ]);
        $rubric = AssessmentRubric::query()
            ->where('task_type', AssessmentTaskType::SpeakingPart1Personal)
            ->firstOrFail();
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Speaking,
            'task_type' => AssessmentTaskType::SpeakingPart1Personal,
            'source_type' => AssessmentSourceType::Practice,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ['Answer the personal question']],
            'response_payload' => ['audio_key' => $submission->audio_key],
            'submitted_at' => now(),
        ]);
        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'criterion_scores' => [['key' => 'fluency', 'score' => 6.0, 'weight' => 0.25]],
            'overall_band' => 6.0,
            'calculation_trace' => ['formula' => 'test'],
        ]);
        AssessmentEvidence::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'signals' => [
                'speech' => [
                    'transcript' => 'I enjoy learning English every day.',
                    'confidence' => 0.86,
                    'speaking_rate' => 112.5,
                    'pause_count' => 2,
                    'word_count' => 6,
                ],
                'pronunciation' => [
                    'overall' => 78,
                ],
                'vocabulary' => [
                    'word_count' => 6,
                    'sentence_count' => 1,
                    'paragraph_count' => 1,
                    'total_error_count' => 0,
                    'grammar_error_count' => 0,
                    'spelling_error_count' => 0,
                    'punctuation_error_count' => 0,
                    'linking_word_count' => 0,
                    'unique_ratio' => 1.0,
                    'avg_word_length' => 5.0,
                    'readability_grade' => 2.0,
                ],
            ],
            'evidence' => [
                'content' => [
                    'content_factor' => 0.9,
                ],
            ],
            'validation' => ['passed' => true],
            'extraction_trace' => ['strategy' => 'test'],
        ]);

        return [$user, $submission];
    }
}
