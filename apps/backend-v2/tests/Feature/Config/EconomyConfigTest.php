<?php

declare(strict_types=1);

namespace Tests\Feature\Config;

use App\Models\SystemConfig;
use Database\Seeders\SystemConfigSeeder;
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
    }

    public function test_system_config_seeder_backfills_missing_keys_without_overwriting_admin_values(): void
    {
        SystemConfig::set('exam.full_test_cost_coins', 42);
        SystemConfig::query()->whereKey('practice.feedback_cost_coins')->delete();

        $this->seed(SystemConfigSeeder::class);

        $this->assertSame(42, SystemConfig::get('exam.full_test_cost_coins'));
        $this->assertSame(1, SystemConfig::get('practice.feedback_cost_coins'));

        $this->getJson('/api/v1/config')
            ->assertOk()
            ->assertJsonPath('data.pricing.exam.full_test_cost_coins', 42)
            ->assertJsonPath('data.pricing.practice.feedback_cost_coins', 1);
    }
}
