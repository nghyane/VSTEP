<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Assessment\Enums\AssessmentTaskType;

final class WritingTask1LetterStrategy extends WritingAssessmentStrategy
{
    public function taskType(): AssessmentTaskType
    {
        return AssessmentTaskType::WritingTask1Letter;
    }
}
