<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Models\AssessmentRubric;

interface EvidenceValidator
{
    public function validate(EvidenceBag $evidence, AssessmentRubric $rubric): EvidenceValidationResult;
}
