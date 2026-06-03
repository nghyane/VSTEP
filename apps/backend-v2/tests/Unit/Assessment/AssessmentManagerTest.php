<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Contracts\AssessmentStrategy;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Services\AssessmentManager;
use App\Models\AssessmentRubric;
use App\Services\Grading\RubricResolver;
use Illuminate\Container\Container;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class AssessmentManagerTest extends TestCase
{
    public function test_resolves_registered_strategy_by_task_type(): void
    {
        $container = new Container;

        $manager = new AssessmentManager($container, new RubricResolver, [
            AssessmentTaskType::WritingTask2Essay->value => ManagerTestAssessmentStrategy::class,
        ]);

        $this->assertSame(AssessmentTaskType::WritingTask2Essay, $manager->strategy(AssessmentTaskType::WritingTask2Essay)->taskType());
    }

    public function test_throws_for_unregistered_strategy(): void
    {
        $container = new Container;

        $manager = new AssessmentManager($container, new RubricResolver, []);

        $this->expectException(InvalidArgumentException::class);

        $manager->strategy(AssessmentTaskType::SpeakingPart1Personal);
    }
}

final class ManagerTestAssessmentStrategy implements AssessmentStrategy
{
    public function taskType(): AssessmentTaskType
    {
        return AssessmentTaskType::WritingTask2Essay;
    }

    public function collectSignals(AssessmentInput $input): SignalBag
    {
        return new SignalBag;
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        return new EvidenceBag;
    }

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        return new EvidenceValidationResult(true);
    }

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag
    {
        return new ScoreBag([], 0.0);
    }

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag
    {
        return new FeedbackBag;
    }
}
