<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentRubric;

interface AssessmentStrategy
{
    public function taskType(): AssessmentTaskType;

    public function collectSignals(AssessmentInput $input): SignalBag;

    public function extractEvidence(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag;

    public function validateEvidence(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult;

    public function score(EvidenceBag $evidence, SignalBag $signals, AssessmentRubric $rubric): ScoreBag;

    public function buildFeedback(ScoreBag $scores, EvidenceBag $evidence, SignalBag $signals): FeedbackBag;
}
