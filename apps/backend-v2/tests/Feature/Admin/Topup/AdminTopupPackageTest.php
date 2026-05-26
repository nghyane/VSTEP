<?php

declare(strict_types=1);

namespace Tests\Feature\Admin\Topup;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Profile;
use App\Models\User;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class AdminTopupPackageTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_cannot_access_admin_topup_packages(): void
    {
        $learner = User::factory()->create(['role' => Role::Learner]);

        $token = $this->tokenFor($learner);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/topup-packages')
            ->assertStatus(403);
    }

    public function test_staff_can_list_packages_with_pagination_meta(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        WalletTopupPackage::factory()->count(3)->create();

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/topup-packages?per_page=2');

        $res->assertOk();
        $res->assertJsonCount(2, 'data');
        $res->assertJsonStructure(['data', 'meta' => ['current_page', 'total', 'per_page', 'last_page']]);
    }

    public function test_staff_can_filter_packages_by_is_active(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        WalletTopupPackage::factory()->create(['is_active' => true, 'label' => 'Active']);
        WalletTopupPackage::factory()->create(['is_active' => false, 'label' => 'Hidden']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/topup-packages?is_active=0');

        $res->assertOk();
        $res->assertJsonCount(1, 'data');
        $res->assertJsonPath('data.0.label', 'Hidden');
    }

    public function test_staff_can_create_package(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/topup-packages', [
                'label' => 'Gói cơ bản 50K',
                'amount_vnd' => 50_000,
                'coins_base' => 50,
                'bonus_coins' => 5,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.label', 'Gói cơ bản 50K');
        $res->assertJsonPath('data.total_coins', 55);
        $res->assertJsonPath('data.is_active', true);
        $this->assertDatabaseHas('wallet_topup_packages', ['label' => 'Gói cơ bản 50K', 'amount_vnd' => 50_000]);
    }

    public function test_store_package_rejects_amount_below_minimum(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/topup-packages', [
                'label' => 'Gói tí hon',
                'amount_vnd' => 500,
                'coins_base' => 1,
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['amount_vnd']);
    }

    public function test_staff_can_update_package(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $package = WalletTopupPackage::factory()->create(['label' => 'Old', 'bonus_coins' => 0]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/topup-packages/{$package->id}", [
                'label' => 'New label',
                'bonus_coins' => 20,
            ]);

        $res->assertOk();
        $res->assertJsonPath('data.label', 'New label');
        $res->assertJsonPath('data.bonus_coins', 20);
    }

    public function test_activate_and_deactivate_endpoints_toggle_state(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $package = WalletTopupPackage::factory()->create(['is_active' => false]);

        $token = $this->tokenFor($staff);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/topup-packages/{$package->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/admin/topup-packages/{$package->id}/deactivate")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_setting_best_value_unsets_previous_best_value(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $oldBest = WalletTopupPackage::factory()->create(['is_best_value' => true, 'label' => 'Old']);
        $newBest = WalletTopupPackage::factory()->create(['is_best_value' => false, 'label' => 'New']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/topup-packages/{$newBest->id}", ['is_best_value' => true]);

        $res->assertOk();
        $res->assertJsonPath('data.is_best_value', true);

        $this->assertDatabaseHas('wallet_topup_packages', ['id' => $newBest->id, 'is_best_value' => true]);
        $this->assertDatabaseHas('wallet_topup_packages', ['id' => $oldBest->id, 'is_best_value' => false]);
    }

    public function test_creating_package_with_best_value_unsets_previous(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $existing = WalletTopupPackage::factory()->create(['is_best_value' => true, 'label' => 'Old best']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/topup-packages', [
                'label' => 'New best',
                'amount_vnd' => 100_000,
                'coins_base' => 100,
                'is_best_value' => true,
            ]);

        $res->assertCreated();
        $res->assertJsonPath('data.is_best_value', true);
        $this->assertDatabaseHas('wallet_topup_packages', ['id' => $existing->id, 'is_best_value' => false]);
    }

    public function test_unsetting_best_value_keeps_others_unchanged(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $best = WalletTopupPackage::factory()->create(['is_best_value' => true]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/admin/topup-packages/{$best->id}", ['is_best_value' => false]);

        $res->assertOk();
        $res->assertJsonPath('data.is_best_value', false);
    }

    public function test_user_facing_packages_endpoint_exposes_is_best_value(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        WalletTopupPackage::factory()->create(['is_best_value' => true, 'is_active' => true, 'label' => 'Featured']);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/wallet/topup-packages');

        $res->assertOk();
        $res->assertJsonPath('data.0.label', 'Featured');
        $res->assertJsonPath('data.0.is_best_value', true);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/topup-packages')->assertStatus(401);
    }

    public function test_store_package_rejects_amount_above_maximum(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/topup-packages', [
                'label' => 'Gói khổng lồ',
                'amount_vnd' => 200_000_000,
                'coins_base' => 1,
            ]);

        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['amount_vnd']);
    }

    public function test_list_falls_back_to_default_sort_when_field_not_whitelisted(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        WalletTopupPackage::factory()->create(['display_order' => 2, 'label' => 'B']);
        WalletTopupPackage::factory()->create(['display_order' => 1, 'label' => 'A']);

        $token = $this->tokenFor($staff);
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/topup-packages?sort=password');

        $res->assertOk();
        $res->assertJsonPath('data.0.label', 'A');
        $res->assertJsonPath('data.1.label', 'B');
    }

    public function test_delete_is_blocked_when_orders_reference_package(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $package = WalletTopupPackage::factory()->create();
        WalletTopupOrder::create([
            'profile_id' => Profile::factory()->create()->id,
            'package_id' => $package->id,
            'amount_vnd' => $package->amount_vnd,
            'coins_to_credit' => $package->coins_base,
            'status' => OrderStatus::Pending,
        ]);

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/topup-packages/{$package->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['package']);

        $this->assertDatabaseHas('wallet_topup_packages', ['id' => $package->id]);
    }

    public function test_staff_can_delete_package(): void
    {
        $staff = User::factory()->create(['role' => Role::Staff]);
        $package = WalletTopupPackage::factory()->create();

        $token = $this->tokenFor($staff);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/topup-packages/{$package->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('wallet_topup_packages', ['id' => $package->id]);
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
