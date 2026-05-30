<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Assessment\Contracts\AssessmentStrategy;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Models\AssessmentRubric;
use LogicException;

abstract class TaskStrategy implements AssessmentStrategy
{
    public function collectSignals(AssessmentInput $input): SignalBag
    {
        throw new LogicException(static::class.' signal collection is not implemented yet.');
    }

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag
    {
        throw new LogicException(static::class.' evidence extraction is not implemented yet.');
    }

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult
    {
        throw new LogicException(static::class.' evidence validation is not implemented yet.');
    }

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag
    {
        throw new LogicException(static::class.' scoring is not implemented yet.');
    }

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag
    {
        throw new LogicException(static::class.' feedback building is not implemented yet.');
    }
}
