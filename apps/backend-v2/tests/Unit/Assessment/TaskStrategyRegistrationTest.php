<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Services\StrategyRegistry;
use Tests\TestCase;

final class TaskStrategyRegistrationTest extends TestCase
{
    public function test_container_registers_strategy_for_each_assessment_task_type(): void
    {
        $registry = $this->app->make(StrategyRegistry::class);

        foreach (AssessmentTaskType::cases() as $taskType) {
            $this->assertSame($taskType, $registry->for($taskType)->taskType());
        }
    }
}
