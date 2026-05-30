<?php

declare(strict_types=1);

namespace App\Assessment\Data;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;

final readonly class AssessmentInput
{
    /**
     * @param  array<string,mixed>  $prompt
     * @param  list<string>  $requirements
     * @param  array<string,mixed>  $metadata
     */
    public function __construct(
        public string $profileId,
        public AssessmentSkill $skill,
        public AssessmentTaskType $taskType,
        public AssessmentSourceType $sourceType,
        public string $sourceId,
        public array $prompt = [],
        public array $requirements = [],
        public ?string $text = null,
        public ?string $audioUrl = null,
        public array $metadata = [],
    ) {}
}
