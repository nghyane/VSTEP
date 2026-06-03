<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Services\AssessmentManager;
use Tests\TestCase;

final class TaskStrategyRegistrationTest extends TestCase
{
    public function test_container_registers_strategy_for_each_assessment_task_type(): void
    {
        $assessments = $this->app->make(AssessmentManager::class);

        foreach (AssessmentTaskType::cases() as $taskType) {
            $this->assertSame($taskType, $assessments->strategy($taskType)->taskType());
        }
    }
}
