<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Enums\CoinTransactionType;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentEvidence;
use App\Models\AssessmentResult;
use App\Models\AssessmentRubric;
use App\Models\PracticeFeedbackRequest;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WritingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_prompts(): void
    {
        PracticeWritingPrompt::factory()->count(2)->create(['part' => 1]);
        PracticeWritingPrompt::factory()->create(['part' => 2]);

        $token = $this->loginLearner();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/writing/prompts?part=1')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_show_prompt_with_children(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/writing/prompts/{$prompt->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $prompt->id);
        $response->assertJsonStructure(['data' => [
            'outline_sections', 'template_sections', 'sample_markers',
        ]]);
    }

    public function test_full_writing_flow(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->tokenFor($user);

        $start = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id]);
        $start->assertCreated();
        $sessionId = $start->json('data.session_id');

        $submit = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", [
                'text' => 'Dear Sir, I am writing to apologize for the inconvenience caused.',
            ]);
        $submit->assertOk();
        $submit->assertJsonPath('data.word_count', 11);
        $submit->assertJsonStructure(['data' => ['attempt_id', 'job_id']]);

        $this->assertDatabaseHas('practice_writing_submissions', [
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
        ]);
        $this->assertDatabaseHas('assessment_attempts', [
            'profile_id' => $profile->id,
            'source_type' => 'practice',
        ]);
        $this->assertDatabaseCount('assessment_jobs', 1);
    }

    public function test_submit_rejects_already_submitted(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();

        $token = $this->tokenFor($user);
        $sessionId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id])
            ->json('data.session_id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", ['text' => 'Hello.'])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/practice/writing/sessions/{$sessionId}/submit", ['text' => 'Again.'])
            ->assertStatus(422);
    }

    public function test_paid_feedback_charges_once_and_is_idempotent(): void
    {
        [$user, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertAccepted()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.cost_coins', 1)
            ->assertJsonPath('data.charged', true)
            ->assertJsonPath('data.feedback.strengths.0', 'Tra loi dung yeu cau de bai');

        $this->assertSame(
            ['Tra loi dung yeu cau de bai'],
            $attempt->result()->firstOrFail()->feedback['strengths'],
        );

        $this->assertDatabaseHas('coin_transactions', [
            'profile_id' => $submission->profile_id,
            'type' => CoinTransactionType::PracticeFeedback->value,
            'delta' => -1,
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertAccepted()
            ->assertJsonPath('data.charged', false);

        $this->assertSame(1, PracticeFeedbackRequest::query()->where('submission_id', $submission->id)->count());
    }

    public function test_assessment_view_returns_normalized_writing_result(): void
    {
        [$user, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/assessment-attempts/{$attempt->id}/view")
            ->assertOk()
            ->assertJsonPath('data.attempt_id', $attempt->id)
            ->assertJsonPath('data.source.type', 'practice_writing')
            ->assertJsonPath('data.context.skill', 'writing')
            ->assertJsonPath('data.context.word_count', 6)
            ->assertJsonPath('data.rubric.max_score', 10)
            ->assertJsonPath('data.result.overall_band', 6)
            ->assertJsonPath('data.result.display.status', 'passed')
            ->assertJsonPath('data.result.display.level', 'B2')
            ->assertJsonPath('data.result.display.ui.show_criterion_breakdown', true)
            ->assertJsonPath('data.result.diagnostics.summary.spelling_error_count', 1)
            ->assertJsonPath('data.result.diagnostics.by_type.spelling.0.text', 'practice')
            ->assertJsonPath('data.result.diagnostics.by_type.spelling.0.suggestions.0', 'practise')
            ->assertJsonPath('data.feedback_request.can_request', true);
    }

    public function test_assessment_view_feedback_endpoint_charges_once(): void
    {
        [$user, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertAccepted()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.charged', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertAccepted()
            ->assertJsonPath('data.charged', false);
    }

    public function test_paid_feedback_rejects_non_owner(): void
    {
        [, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        $intruder = User::factory()->create();
        Profile::factory()->initial()->forAccount($intruder)->create();
        $token = $this->tokenFor($intruder);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertForbidden();
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

    /** @return array{User, PracticeWritingSubmission} */
    private function gradedWritingSubmission(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();
        $session = PracticeSession::factory()->create([
            'profile_id' => $profile->id,
            'module' => 'writing',
            'content_ref_type' => 'practice_writing_prompt',
            'content_ref_id' => $prompt->id,
        ]);

        $submission = PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
            'text' => 'This is a practice writing answer.',
            'word_count' => 6,
            'submitted_at' => now(),
        ]);
        $rubric = AssessmentRubric::query()
            ->where('task_type', AssessmentTaskType::WritingTask2Essay)
            ->firstOrFail();
        $attempt = AssessmentAttempt::create([
            'profile_id' => $profile->id,
            'rubric_id' => $rubric->id,
            'skill' => AssessmentSkill::Writing,
            'task_type' => AssessmentTaskType::WritingTask2Essay,
            'source_type' => AssessmentSourceType::Practice,
            'source_id' => $submission->id,
            'prompt' => ['requirements' => ['Write clearly']],
            'response_payload' => ['text' => $submission->text, 'metadata' => ['word_count' => $submission->word_count]],
            'submitted_at' => now(),
        ]);
        AssessmentResult::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'criterion_scores' => [['key' => 'grammar', 'score' => 6.0, 'weight' => 0.25]],
            'overall_band' => 6.0,
            'calculation_trace' => ['formula' => 'test'],
        ]);
        AssessmentEvidence::create([
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
            'signals' => [
                'grammar' => [
                    'errors' => [[
                        'offset' => 10,
                        'length' => 8,
                        'message' => 'Possible spelling mistake found.',
                        'category' => 'Typos',
                        'rule_id' => 'MORFOLOGIK_RULE_EN_US',
                        'replacements' => ['practise'],
                    ]],
                    'annotations' => [[
                        'start' => 10,
                        'end' => 18,
                        'severity' => 'error',
                        'category' => 'typos',
                        'message' => 'Possible spelling mistake found.',
                        'suggestion' => 'practise',
                    ]],
                ],
                'vocabulary' => [
                    'word_count' => 6,
                    'sentence_count' => 1,
                    'paragraph_count' => 1,
                    'total_error_count' => 1,
                    'grammar_error_count' => 0,
                    'spelling_error_count' => 1,
                    'punctuation_error_count' => 0,
                    'linking_word_count' => 0,
                    'unique_ratio' => 1.0,
                    'avg_word_length' => 4.8,
                    'readability_grade' => 1.0,
                ],
            ],
            'evidence' => [],
            'validation' => ['passed' => true],
            'extraction_trace' => ['strategy' => 'test'],
        ]);

        return [$user, $submission];
    }
}
