<?php

declare(strict_types=1);

namespace Tests\Feature\Assessment;

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
use App\Assessment\Services\AssessmentProcessingService;
use App\Assessment\Services\AssessmentSubmissionService;
use App\Assessment\Services\StrategyRegistry;
use App\Jobs\ProcessAssessmentJob;
use App\Models\AssessmentRubric;
use App\Models\GradingRubric;
use App\Models\Profile;
use App\Models\User;
use App\Services\AssessmentResultDisplayService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AssessmentProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_submits_and_processes_assessment_attempt(): void
    {
        $this->app->singleton(StrategyRegistry::class, fn () => new StrategyRegistry([
            new PassingAssessmentStrategy,
        ]));

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
        $this->app->singleton(StrategyRegistry::class, fn () => new StrategyRegistry([
            new FailingAssessmentStrategy,
        ]));

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
        $this->app->singleton(StrategyRegistry::class, fn () => new StrategyRegistry([
            new PassingAssessmentStrategy,
        ]));

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
        $this->assertEquals($expectedCap, $result->caps_applied['short_response_word_count']['cap']);

        $display = $this->app->make(AssessmentResultDisplayService::class)->forResult($result);
        $this->assertSame('not_assessable', $display['status']);
        $this->assertFalse($display['is_assessable']);
        $this->assertFalse($display['ui']['show_criterion_breakdown']);

        foreach ($result->criterion_scores as $criterion) {
            $this->assertEquals($expectedCap, $criterion['score']);
        }
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
