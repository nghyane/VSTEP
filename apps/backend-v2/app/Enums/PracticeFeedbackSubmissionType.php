<?php

declare(strict_types=1);

namespace App\Enums;

use App\Assessment\Enums\AssessmentSkill;

enum PracticeFeedbackSubmissionType: string
{
    case Writing = 'practice_writing';
    case Speaking = 'practice_speaking';

    public static function fromSkill(AssessmentSkill $skill): self
    {
        return match ($skill) {
            AssessmentSkill::Writing => self::Writing,
            AssessmentSkill::Speaking => self::Speaking,
        };
    }
}
