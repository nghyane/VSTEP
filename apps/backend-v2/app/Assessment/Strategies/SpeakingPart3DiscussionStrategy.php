<?php

declare(strict_types=1);

namespace App\Assessment\Strategies;

use App\Assessment\Enums\AssessmentTaskType;

final class SpeakingPart3DiscussionStrategy extends SpeakingAssessmentStrategy
{
    public function taskType(): AssessmentTaskType
    {
        return AssessmentTaskType::SpeakingPart3Discussion;
    }
}
