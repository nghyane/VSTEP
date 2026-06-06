<?php

declare(strict_types=1);

namespace Tests\Feature\Practice;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Enums\CoinTransactionType;
use App\Enums\PracticeFeedbackStatus;
use App\Enums\PracticeFeedbackSubmissionType;
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
use App\Services\LanguageToolService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WritingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_prompts(): void
    {
        $submittedPrompt = PracticeWritingPrompt::factory()->create([
            'part' => 1,
            'description' => 'Describe a useful study habit.',
        ]);
        $unsubmittedPrompt = PracticeWritingPrompt::factory()->create(['part' => 1]);
        PracticeWritingPrompt::factory()->create(['part' => 2]);
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $session = PracticeSession::factory()->create([
            'profile_id' => $profile->id,
            'module' => 'writing',
            'content_ref_type' => 'practice_writing_prompt',
            'content_ref_id' => $submittedPrompt->id,
        ]);
        PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $submittedPrompt->id,
            'text' => 'This answer has already been submitted.',
            'word_count' => 6,
            'submitted_at' => now(),
        ]);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/practice/writing/prompts?part=1')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment([
                'id' => $submittedPrompt->id,
                'description' => 'Describe a useful study habit.',
                'has_submitted' => true,
            ])
            ->assertJsonFragment([
                'id' => $unsubmittedPrompt->id,
                'has_submitted' => false,
            ]);
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

    public function test_unpublished_prompt_is_not_accessible(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create(['is_published' => false]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/practice/writing/prompts/{$prompt->id}")
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/sessions', ['exercise_id' => $prompt->id])
            ->assertNotFound();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => 'Dear John, I am writing to thank you.',
            ])
            ->assertNotFound();
    }

    public function test_realtime_writing_diagnostics_returns_readiness_and_requirement_metrics(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create([
            'part' => 1,
            'min_words' => 120,
            'required_points' => ['Apologize for missing the party'],
        ]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => 'Dear John, I apologize for missing the party.',
            ])
            ->assertOk()
            ->assertJsonPath('data.diagnostics.word_requirement.minimum', 120)
            ->assertJsonPath('data.diagnostics.word_requirement.is_met', false)
            ->assertJsonPath('data.diagnostics.format.letter_format_expected', true)
            ->assertJsonPath('data.diagnostics.format.has_salutation', true)
            ->assertJsonPath('data.diagnostics.task_coverage.source', 'heuristic')
            ->assertJsonPath('data.readiness.status', 'needs_work');
    }

    public function test_realtime_writing_diagnostics_requires_authentication(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create();

        $this->postJson('/api/v1/practice/writing/diagnostics', [
            'prompt_id' => $prompt->id,
            'text' => 'Dear John, I am writing to thank you.',
        ])->assertUnauthorized();
    }

    public function test_realtime_writing_diagnostics_validates_payload(): void
    {
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => 'not-a-uuid',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['prompt_id', 'text']);
    }

    public function test_realtime_writing_diagnostics_counts_empty_text_as_zero_words(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create(['min_words' => 100]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => " \n\t ",
            ])
            ->assertOk()
            ->assertJsonPath('data.diagnostics.summary.word_count', 0)
            ->assertJsonPath('data.diagnostics.word_requirement.actual', 0)
            ->assertJsonPath('data.diagnostics.word_requirement.missing', 100)
            ->assertJsonPath('data.diagnostics.task_coverage.covered_points', 0)
            ->assertJsonPath('data.readiness.status', 'needs_work');
    }

    public function test_realtime_writing_diagnostics_flags_non_english_text(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create(['min_words' => 1]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => 'Tôi muốn viết bài này bằng tiếng Việt.',
            ])
            ->assertOk()
            ->assertJsonPath('data.language.is_english', false)
            ->assertJsonPath('data.readiness.status', 'needs_work')
            ->assertJsonPath('data.readiness.reasons.0.code', 'non_english');
    }

    public function test_realtime_writing_diagnostics_returns_ready_when_basic_checks_pass(): void
    {
        $prompt = PracticeWritingPrompt::factory()->create([
            'part' => 2,
            'min_words' => 10,
            'required_points' => ['Discuss education benefits'],
        ]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => 'Education benefits learners because education improves opportunities and builds confidence for young people today.',
            ])
            ->assertOk()
            ->assertJsonPath('data.diagnostics.word_requirement.is_met', true)
            ->assertJsonPath('data.diagnostics.task_coverage.requirements.0.met', true)
            ->assertJsonPath('data.readiness.status', 'ready');
    }

    public function test_realtime_writing_diagnostics_marks_language_tool_outage_as_unavailable(): void
    {
        $this->app->bind(LanguageToolService::class, function () {
            $mock = $this->createMock(LanguageToolService::class);
            $mock->method('check')->willThrowException(new \RuntimeException('down'));
            $mock->method('toAnnotations')->willReturn([]);

            return $mock;
        });

        $prompt = PracticeWritingPrompt::factory()->create([
            'part' => 2,
            'min_words' => 5,
            'required_points' => ['Discuss education benefits'],
        ]);
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/practice/writing/diagnostics', [
                'prompt_id' => $prompt->id,
                'text' => 'Education benefits learners because education improves opportunities and builds confidence.',
            ])
            ->assertOk()
            ->assertJsonPath('data.diagnostics.service_status.language_tool.available', false)
            ->assertJsonPath('data.diagnostics.summary.total_error_count', null)
            ->assertJsonPath('data.readiness.status', 'needs_work')
            ->assertJsonPath('data.readiness.reasons.0.code', 'language_check_unavailable');
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

    public function test_paid_feedback_retries_without_charge_when_saved_feedback_is_empty(): void
    {
        [$user, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        $attempt->result()->firstOrFail()->update(['feedback' => []]);
        PracticeFeedbackRequest::create([
            'profile_id' => $submission->profile_id,
            'submission_type' => PracticeFeedbackSubmissionType::Writing->value,
            'submission_id' => $submission->id,
            'status' => PracticeFeedbackStatus::Ready,
            'requested_at' => now(),
            'completed_at' => now(),
        ]);
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/assessment-attempts/{$attempt->id}/feedback")
            ->assertAccepted()
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.charged', false)
            ->assertJsonPath('data.feedback.strengths.0', 'Tra loi dung yeu cau de bai');

        $this->assertSame(
            ['Tra loi dung yeu cau de bai'],
            $attempt->result()->firstOrFail()->feedback['strengths'],
        );
        $this->assertDatabaseMissing('coin_transactions', [
            'profile_id' => $submission->profile_id,
            'type' => CoinTransactionType::PracticeFeedback->value,
        ]);
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
            ->assertJsonPath('data.result.diagnostics.word_requirement.minimum', 250)
            ->assertJsonPath('data.result.diagnostics.word_requirement.missing', 244)
            ->assertJsonPath('data.result.diagnostics.task_coverage.requirements.0.met', true)
            ->assertJsonPath('data.result.diagnostics.format.has_salutation', false)
            ->assertJsonPath('data.result.diagnostics.by_type.spelling.0.text', 'practice')
            ->assertJsonPath('data.result.diagnostics.by_type.spelling.0.suggestions.0', 'practise')
            ->assertJsonPath('data.feedback_request.can_request', true);
    }

    public function test_assessment_view_marks_missing_writing_diagnostics_as_null(): void
    {
        [$user, $submission] = $this->gradedWritingSubmission();
        $attempt = $submission->assessmentAttempt()->firstOrFail();
        AssessmentEvidence::query()
            ->where('attempt_id', $attempt->id)
            ->update(['signals' => [], 'evidence' => []]);
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/assessment-attempts/{$attempt->id}/view")
            ->assertOk()
            ->assertJsonPath('data.result.diagnostics.data_status.vocabulary_metrics_available', false)
            ->assertJsonPath('data.result.diagnostics.summary.word_count', null)
            ->assertJsonPath('data.result.diagnostics.summary.total_error_count', null)
            ->assertJsonPath('data.result.diagnostics.word_requirement.actual', null)
            ->assertJsonPath('data.result.diagnostics.word_requirement.missing', null)
            ->assertJsonPath('data.result.diagnostics.task_coverage.covered_points', null)
            ->assertJsonPath('data.result.diagnostics.task_coverage.coverage_ratio', null)
            ->assertJsonPath('data.result.diagnostics.format.has_salutation', null)
            ->assertJsonPath('data.result.diagnostics.cohesion.linking_word_count', null);
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
                    'has_salutation' => false,
                    'has_closing' => false,
                    'tone_signals' => [
                        'formal_count' => 0,
                        'informal_count' => 0,
                        'informal_words' => [],
                    ],
                ],
            ],
            'evidence' => [
                'task' => [
                    'points_covered' => 1,
                    'points_required' => 1,
                    'requirements_met' => [true],
                    'word_count' => 6,
                ],
            ],
            'validation' => ['passed' => true],
            'extraction_trace' => ['strategy' => 'test'],
        ]);

        return [$user, $submission];
    }
}
