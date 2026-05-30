<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\SignalBag;

interface SignalAnalyzer
{
    public function analyze(AssessmentInput $input): SignalBag;
}
