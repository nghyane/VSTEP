<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Assessment\Enums\AssessmentTaskType;

final class SpeakingPart1PersonalStrategy extends SpeakingAssessmentStrategy
{
    public function taskType(): AssessmentTaskType
    {
        return AssessmentTaskType::SpeakingPart1Personal;
    }
}
