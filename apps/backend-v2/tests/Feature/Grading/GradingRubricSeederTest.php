<?php

declare(strict_types=1);

namespace Tests\Feature\Grading;

use App\Models\GradingRubric;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GradingRubricSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_keeps_one_stable_rubric_per_productive_skill(): void
    {
        $this->assertSame(1, GradingRubric::query()->where('skill', 'writing')->count());
        $this->assertSame(1, GradingRubric::query()->where('skill', 'speaking')->count());

        $writing = GradingRubric::query()->where('skill', 'writing')->firstOrFail();
        $speaking = GradingRubric::query()->where('skill', 'speaking')->firstOrFail();

        $this->assertTrue($writing->is_active);
        $this->assertTrue($speaking->is_active);
        $this->assertSame(1, $writing->version);
        $this->assertSame(1, $speaking->version);
        $this->assertSame('equal_weighted_mean_rounded_half', $writing->scoring_formula);
        $this->assertSame('equal_weighted_mean_rounded_half', $speaking->scoring_formula);
    }

    public function test_writing_rubric_uses_equal_criterion_weights_and_no_task_one_ceiling(): void
    {
        $rubric = GradingRubric::query()->where('skill', 'writing')->firstOrFail();
        $criteria = collect($rubric->criteria)->keyBy('key');

        $this->assertSame(
            ['task_fulfillment', 'organization', 'grammar', 'vocabulary'],
            array_values(array_column($rubric->criteria, 'key')),
        );

        foreach ($criteria as $criterion) {
            $this->assertSame(0.25, (float) $criterion['weight']);
        }

        $taskFulfillment = $criteria->get('task_fulfillment');
        $this->assertNotNull($taskFulfillment);

        $this->assertSame(
            (float) $taskFulfillment['params']['coverage_multiplier'],
            (float) $taskFulfillment['params']['task1_multiplier'],
        );
        $this->assertArrayHasKey('non_assessable_word_limit', $taskFulfillment['params']);
        $this->assertArrayHasKey('severe_minimum_words_task1', $taskFulfillment['params']);
        $this->assertArrayHasKey('severe_minimum_words_task2', $taskFulfillment['params']);
        $this->assertArrayHasKey('minimum_covered_points', $taskFulfillment['params']);
        $this->assertArrayHasKey('short_response_caps', $taskFulfillment['params']);
        $this->assertArrayHasKey('task_fulfillment_word_caps', $taskFulfillment['params']);

        $params = $rubric->taskFulfillmentParams();
        $this->assertTrue($params->isNonAssessable($params->nonAssessableWordLimit - 1));
        $this->assertNotNull($params->shortResponseScoreCap($params->nonAssessableWordLimit - 1));
        $this->assertNotNull($params->taskFulfillmentScoreCap($params->wordMinimumTask1 - 1));
        $this->assertSame(60, $params->severeMinimumWords(1));
        $this->assertSame(125, $params->severeMinimumWords(2));
        $this->assertSame(1, $params->minimumCoveredPoints);
    }
}
