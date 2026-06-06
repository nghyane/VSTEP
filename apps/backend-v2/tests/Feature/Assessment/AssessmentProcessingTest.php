<?php

declare(strict_types=1);

namespace Tests\Feature\Assessment;

use App\Ai\Contracts\ContentRelevanceAssessor;
use App\Assessment\Contracts\AssessmentStrategy;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentJobStatus;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Enums\CriterionKey;
use App\Assessment\Services\AssessmentManager;
use App\Assessment\Services\AssessmentProcessingService;
use App\Assessment\Services\AssessmentSubmissionService;
use App\Jobs\ProcessAssessmentJob;
use App\Models\AssessmentRubric;
use App\Models\GradingRubric;
use App\Models\Profile;
use App\Models\User;
use App\Services\AssessmentResultDisplayService;
use App\Services\AudioStorageService;
use App\Services\Grading\RubricResolver;
use App\Services\SpeechToText;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AssessmentProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_submits_and_processes_assessment_attempt(): void
    {
        $this->fakeAssessmentManager(PassingAssessmentStrategy::class);

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $rubric = $this->activeRubric();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask2Essay,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000001',
            prompt: ['title' => 'Sample prompt'],
            requirements: ['Discuss both views'],
            text: 'This is a sample response.',
        ));

        $this->assertSame($rubric->id, $attempt->rubric_id);
        $this->assertSame(AssessmentJobStatus::Pending, $attempt->job->status);

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);

        $this->assertSame(6.0, $result->overall_band);
        $this->assertDatabaseHas('assessment_jobs', [
            'id' => $attempt->job->id,
            'status' => AssessmentJobStatus::Ready->value,
        ]);
        $this->assertDatabaseHas('assessment_evidence', [
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
        ]);
        $this->assertDatabaseHas('assessment_results', [
            'attempt_id' => $attempt->id,
            'rubric_id' => $rubric->id,
        ]);
    }

    public function test_marks_job_failed_when_evidence_is_invalid(): void
    {
        $this->fakeAssessmentManager(FailingAssessmentStrategy::class);

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $this->activeRubric();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask2Essay,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000002',
            text: 'Invalid sample response.',
        ));

        $this->expectException(\RuntimeException::class);

        try {
            $this->app->make(AssessmentProcessingService::class)->process($attempt->job);
        } finally {
            $this->assertDatabaseHas('assessment_jobs', [
                'id' => $attempt->job->id,
                'status' => AssessmentJobStatus::Failed->value,
                'last_error' => 'Assessment evidence validation failed: missing evidence',
            ]);
        }
    }

    public function test_queue_job_processes_assessment_job(): void
    {
        $this->fakeAssessmentManager(PassingAssessmentStrategy::class);

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $this->activeRubric();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask2Essay,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000003',
            text: 'Queued sample response.',
        ));

        (new ProcessAssessmentJob($attempt->job->id))->handle($this->app->make(AssessmentProcessingService::class));

        $this->assertDatabaseHas('assessment_jobs', [
            'id' => $attempt->job->id,
            'status' => AssessmentJobStatus::Ready->value,
        ]);
    }

    public function test_extremely_short_writing_response_is_scored_as_non_assessable(): void
    {
        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $tfParams = GradingRubric::query()->where('skill', 'writing')->firstOrFail()->taskFulfillmentParams();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask1Letter,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000004',
            prompt: [
                'part' => 1,
                'prompt' => 'Write a letter to apologize, explain, and suggest a plan.',
            ],
            requirements: ['Apologize for missing the party', 'Explain why you could not attend', 'Suggest a plan to make it up'],
            text: 'hrrrlnhập đại cũng có điểm',
            metadata: ['word_count' => 1],
        ));

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);
        $expectedCap = $tfParams->shortResponseScoreCap(1);

        $this->assertSame($expectedCap, $result->overall_band);
        $this->assertSame('assessment_requirements_not_met', $result->caps_applied['type']);
        $this->assertContains('severe_minimum_word_count', $result->caps_applied['failed_requirements']);
        $this->assertSame($tfParams->severeMinimumWords(1), $result->caps_applied['severe_minimum_word_count']);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertSame('not_assessable', $display['status']);
        $this->assertFalse($display['is_assessable']);
        $this->assertFalse($display['ui']['show_criterion_breakdown']);

        foreach ($result->criterion_scores as $criterion) {
            $this->assertEquals($expectedCap, $criterion['score']);
        }
    }

    public function test_writing_response_with_no_task_coverage_is_non_assessable(): void
    {
        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $prompt = "You forgot your close friend's birthday party last weekend. Write a letter to your friend to:\n- Apologize for missing the party\n- Explain why you couldn't attend\n- Suggest a plan to make it up";

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask1Letter,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000005',
            prompt: [
                'part' => 1,
                'prompt' => $prompt,
            ],
            requirements: ['apologize', 'explain reason', 'suggest plan'],
            text: $prompt,
            metadata: ['word_count' => 36],
        ));

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);

        $this->assertSame(1.0, $result->overall_band);
        $this->assertSame('assessment_requirements_not_met', $result->caps_applied['type']);
        $this->assertSame(0, $result->caps_applied['points_covered']);
        $this->assertContains('severe_minimum_word_count', $result->caps_applied['failed_requirements']);
        $this->assertContains('task_coverage', $result->caps_applied['failed_requirements']);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertSame('not_assessable', $display['status']);
        $this->assertFalse($display['is_assessable']);
        $this->assertFalse($display['ui']['show_criterion_breakdown']);

        foreach ($result->criterion_scores as $criterion) {
            $this->assertEquals(1.0, $criterion['score']);
        }
    }

    public function test_under_target_writing_with_task_coverage_remains_assessable(): void
    {
        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $text = str_repeat('I am sorry that I missed your birthday party because my family had an emergency. ', 7);

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Writing,
            taskType: AssessmentTaskType::WritingTask1Letter,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000006',
            prompt: [
                'part' => 1,
                'prompt' => 'Write a letter to apologize, explain, and suggest a plan.',
            ],
            requirements: ['apologize', 'explain reason', 'suggest plan'],
            text: $text,
            metadata: ['word_count' => 84],
        ));

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);

        $this->assertNotSame('assessment_requirements_not_met', $result->caps_applied['type'] ?? null);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertNotSame('not_assessable', $display['status']);
        $this->assertTrue($display['ui']['show_criterion_breakdown']);
    }

    public function test_unclear_speaking_audio_is_not_assessable_and_skips_content_relevance(): void
    {
        $relevance = new CountingContentRelevanceAssessor;
        $this->app->instance(ContentRelevanceAssessor::class, $relevance);
        $this->app->bind(SpeechToText::class, fn () => new UnclearSpeechToText);

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Speaking,
            taskType: AssessmentTaskType::SpeakingPart1Personal,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000007',
            prompt: ['content' => ['Talk about your hometown.']],
            requirements: ['Answer the question about your hometown'],
            audioKey: 'audio/unclear.webm',
        ));

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);
        $attempt->refresh()->load('evidence');

        $this->assertSame(0, $relevance->calls);
        $this->assertEquals(0.0, $attempt->evidence->evidence['content']['content_factor']);
        $this->assertSame('unassessable_speech', $attempt->evidence->evidence['content']['content_status']);
        $this->assertSame(1.0, $result->overall_band);
        $this->assertSame('speaking_response_too_short', $result->caps_applied['type']);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertSame('not_assessable', $display['status']);
        $this->assertSame('speaking_too_short', $display['reason']['code']);
        $this->assertFalse($display['ui']['show_feedback']);
    }

    public function test_low_confidence_speaking_audio_skips_content_relevance_and_cannot_pass(): void
    {
        $relevance = new CountingContentRelevanceAssessor;
        $this->app->instance(ContentRelevanceAssessor::class, $relevance);
        $this->app->bind(SpeechToText::class, fn () => new LowConfidenceSpeechToText);

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();

        $attempt = $this->app->make(AssessmentSubmissionService::class)->submit(new AssessmentInput(
            profileId: $profile->id,
            skill: AssessmentSkill::Speaking,
            taskType: AssessmentTaskType::SpeakingPart1Personal,
            sourceType: AssessmentSourceType::Practice,
            sourceId: '00000000-0000-0000-0000-000000000008',
            prompt: ['content' => ['Talk about your hometown.']],
            requirements: ['Answer the question about your hometown'],
            audioKey: 'audio/low-confidence.webm',
        ));

        $result = $this->app->make(AssessmentProcessingService::class)->process($attempt->job);
        $attempt->refresh()->load('evidence');

        $this->assertSame(0, $relevance->calls);
        $this->assertEquals(0.0, $attempt->evidence->evidence['content']['content_factor']);
        $this->assertSame('unassessable_speech', $attempt->evidence->evidence['content']['content_status']);
        $this->assertSame(1.0, $result->overall_band);
        $this->assertSame('speaking_audio_unassessable', $result->caps_applied['type']);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertSame('not_assessable', $display['status']);
        $this->assertSame('speaking_unreliable', $display['reason']['code']);
    }

    private function activeRubric(): AssessmentRubric
    {
        return AssessmentRubric::updateOrCreate(
            ['task_type' => AssessmentTaskType::WritingTask2Essay, 'version' => 1],
            [
                'skill' => AssessmentSkill::Writing,
                'title' => 'Writing Task 2 Essay',
                'criteria' => [],
                'evidence_schema' => [],
                'scoring_policy' => [],
                'is_active' => true,
                'effective_from' => now(),
            ],
        );
    }

    /** @param class-string<AssessmentStrategy> $strategyClass */
    private function fakeAssessmentManager(string $strategyClass): void
    {
        $this->app->singleton(AssessmentManager::class, fn ($app) => new AssessmentManager(
            $app,
            $app->make(RubricResolver::class),
            [AssessmentTaskType::WritingTask2Essay->value => $strategyClass],
        ));
    }
}

class PassingAssessmentStrategy implements AssessmentStrategy
{
    public function taskType(): AssessmentTaskType
    {
        return AssessmentTaskType::WritingTask2Essay;
    }

    public function collectSignals(AssessmentInput $input): SignalBag
    {
        return new SignalBag(grammar: ['sentence_count' => 1]);
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        return new EvidenceBag(task: ['covered' => true]);
    }

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        return new EvidenceValidationResult(true);
    }

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag
    {
        return new ScoreBag([
            new CriterionScore(CriterionKey::TaskFulfillment, 6.0, 1.0),
        ], 6.0, calculationTrace: ['method' => 'fake']);
    }

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag
    {
        return new FeedbackBag(strengths: ['Clear response']);
    }
}

final class FailingAssessmentStrategy extends PassingAssessmentStrategy
{
    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        return new EvidenceValidationResult(false, ['missing evidence']);
    }
}

final class CountingContentRelevanceAssessor implements ContentRelevanceAssessor
{
    public int $calls = 0;

    public function assess(string $transcript, string $prompt, array $requirements): float
    {
        $this->calls++;

        return 1.0;
    }
}

final class UnclearSpeechToText implements SpeechToText
{
    public function transcribe(string $audioContent, string $language = 'en-US', ?string $contentType = null): ?array
    {
        return $this->result();
    }

    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        return $this->result();
    }

    private function result(): array
    {
        return [
            'text' => '',
            'confidence' => 0.0,
            'duration_ms' => 0,
            'word_count' => 0,
            'pause_count' => 0,
            'speaking_rate' => 0.0,
            'pronunciation' => null,
        ];
    }
}

final class LowConfidenceSpeechToText implements SpeechToText
{
    public function transcribe(string $audioContent, string $language = 'en-US', ?string $contentType = null): ?array
    {
        return $this->result();
    }

    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        return $this->result();
    }

    private function result(): array
    {
        $text = implode(' ', array_fill(0, 50, 'hello')).'.';

        return [
            'text' => $text,
            'confidence' => 0.2,
            'duration_ms' => 25_000,
            'word_count' => 50,
            'pause_count' => 2,
            'speaking_rate' => 120.0,
            'pronunciation' => [
                'accuracy' => 5.0,
                'fluency' => 5.0,
                'prosody' => 5.0,
                'completeness' => 5.0,
                'overall' => 5.0,
            ],
        ];
    }
}
