<?php

declare(strict_types=1);

namespace App\Assessment\Rubrics;

use App\Assessment\Contracts\RubricResolver;
use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentRubric;

final class DatabaseRubricResolver implements RubricResolver
{
    public function activeFor(AssessmentTaskType $taskType): AssessmentRubric
    {
        return AssessmentRubric::query()
            ->active()
            ->where('skill', $taskType->skill()->value)
            ->where('task_type', $taskType->value)
            ->orderByDesc('version')
            ->firstOrFail();
    }
}
