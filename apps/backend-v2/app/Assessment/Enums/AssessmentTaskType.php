<?php

declare(strict_types=1);

namespace App\Assessment\Enums;

enum AssessmentTaskType: string
{
    case WritingTask1Letter = 'writing_task_1_letter';
    case WritingTask2Essay = 'writing_task_2_essay';
    case SpeakingPart1Personal = 'speaking_part_1_personal';
    case SpeakingPart2Solution = 'speaking_part_2_solution';
    case SpeakingPart3Discussion = 'speaking_part_3_discussion';

    public function skill(): AssessmentSkill
    {
        return match ($this) {
            self::WritingTask1Letter, self::WritingTask2Essay => AssessmentSkill::Writing,
            self::SpeakingPart1Personal, self::SpeakingPart2Solution, self::SpeakingPart3Discussion => AssessmentSkill::Speaking,
        };
    }
}
