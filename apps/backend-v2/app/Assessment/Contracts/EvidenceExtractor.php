<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\SignalBag;
use App\Models\AssessmentRubric;

interface EvidenceExtractor
{
    public function extract(AssessmentInput $input, SignalBag $signals, AssessmentRubric $rubric): EvidenceBag;
}
