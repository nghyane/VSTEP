<?php

declare(strict_types=1);

namespace Tests\Feature\Meta;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EconomyMetaTest extends TestCase
{
    use RefreshDatabase;

    public function test_economy_meta_returns_pricing_config(): void
    {
        $response = $this->getJson('/api/v1/meta/economy');

        $response->assertOk();
        $response->assertJsonPath('data.wallet.onboarding_initial_coins', 100);
        $response->assertJsonPath('data.pricing.exam.full_test_cost_coins', 25);
        $response->assertJsonPath('data.pricing.exam.custom_per_skill_coins', 8);
        $response->assertJsonPath('data.pricing.exam.max_cost_coins', 25);
        $response->assertJsonPath('data.pricing.practice.support_level_costs.1', 1);
        $response->assertJsonPath('data.pricing.practice.support_level_costs.2', 2);
    }
}
