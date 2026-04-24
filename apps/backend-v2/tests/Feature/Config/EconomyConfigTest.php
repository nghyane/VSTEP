<?php

declare(strict_types=1);

namespace Tests\Feature\Config;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EconomyConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_config_returns_pricing_config(): void
    {
        $response = $this->getJson('/api/v1/config');

        $response->assertOk();
        $response->assertJsonPath('data.wallet.onboarding_initial_coins', 100);
        $response->assertJsonPath('data.pricing.exam.full_test_cost_coins', 25);
        $response->assertJsonPath('data.pricing.exam.custom_per_skill_coins', 8);
        $response->assertJsonPath('data.pricing.exam.max_cost_coins', 25);
        $response->assertJsonPath('data.pricing.practice.support_level_costs.1', 1);
        $response->assertJsonPath('data.pricing.practice.support_level_costs.2', 2);
    }
}
