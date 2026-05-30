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
use App\Assessment\Services\StrategyRegistry;
use App\Models\AssessmentRubric;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class StrategyRegistryTest extends TestCase
{
    public function test_resolves_registered_strategy_by_task_type(): void
    {
        $strategy = new class implements AssessmentStrategy
        {
            public function taskType(): AssessmentTaskType
            {
                return AssessmentTaskType::WritingTask1Letter;
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
        };

        $registry = new StrategyRegistry([$strategy]);

        $this->assertSame($strategy, $registry->for(AssessmentTaskType::WritingTask1Letter));
    }

    public function test_throws_for_unregistered_strategy(): void
    {
        $registry = new StrategyRegistry;

        $this->expectException(InvalidArgumentException::class);

        $registry->for(AssessmentTaskType::SpeakingPart1Personal);
    }
}
