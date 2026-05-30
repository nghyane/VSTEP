<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentTaskType;
use PHPUnit\Framework\TestCase;

final class AssessmentTaskTypeTest extends TestCase
{
    public function test_writing_task_types_resolve_writing_skill(): void
    {
        $this->assertSame(AssessmentSkill::Writing, AssessmentTaskType::WritingTask1Letter->skill());
        $this->assertSame(AssessmentSkill::Writing, AssessmentTaskType::WritingTask2Essay->skill());
    }

    public function test_speaking_task_types_resolve_speaking_skill(): void
    {
        $this->assertSame(AssessmentSkill::Speaking, AssessmentTaskType::SpeakingPart1Personal->skill());
        $this->assertSame(AssessmentSkill::Speaking, AssessmentTaskType::SpeakingPart2Solution->skill());
        $this->assertSame(AssessmentSkill::Speaking, AssessmentTaskType::SpeakingPart3Discussion->skill());
    }
}
