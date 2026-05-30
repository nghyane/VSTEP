<?php

declare(strict_types=1);

namespace App\Assessment\Contracts;

use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentRubric;

interface RubricResolver
{
    public function activeFor(AssessmentTaskType $taskType): AssessmentRubric;
}
