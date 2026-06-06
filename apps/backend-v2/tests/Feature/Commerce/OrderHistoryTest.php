<?php

declare(strict_types=1);

namespace Tests\Feature\Commerce;

use App\Enums\OrderStatus;
use App\Models\Course;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use App\Models\User;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class OrderHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_learner_can_list_own_order_history_with_default_page_size(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $user->update(['active_profile_id' => $profile->id]);

        $package = WalletTopupPackage::factory()->create(['label' => 'Gói 100 xu']);
        $course = Course::factory()->create(['title' => 'B2 Intensive']);

        WalletTopupOrder::create([
            'account_id' => $user->id,
            'profile_id' => $profile->id,
            'package_id' => $package->id,
            'order_code' => 910001,
            'amount_vnd' => 100_000,
            'coins_to_credit' => 120,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
            'paid_at' => now()->subMinute(),
        ]);
        CourseEnrollmentOrder::create([
            'profile_id' => $profile->id,
            'course_id' => $course->id,
            'order_code' => 910002,
            'amount_vnd' => 1_500_000,
            'status' => OrderStatus::Pending,
            'payment_provider' => 'payos',
            'payment_url' => 'https://pay.payos.test/course',
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson('/api/v1/me/orders')
            ->assertOk()
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.type', 'course')
            ->assertJsonPath('data.0.item_name', 'B2 Intensive')
            ->assertJsonPath('data.1.type', 'topup')
            ->assertJsonPath('data.1.coins_to_credit', 120);
    }

    public function test_order_history_is_scoped_to_account_and_active_profile(): void
    {
        $user = User::factory()->create();
        $activeProfile = Profile::factory()->initial()->forAccount($user)->create();
        $otherProfileSameAccount = Profile::factory()->forAccount($user)->create();
        $otherUser = User::factory()->create();
        $otherUserProfile = Profile::factory()->initial()->forAccount($otherUser)->create();
        $user->update(['active_profile_id' => $activeProfile->id]);

        $package = WalletTopupPackage::factory()->create();
        $activeCourse = Course::factory()->create(['title' => 'Active profile course']);
        $otherProfileCourse = Course::factory()->create(['title' => 'Other profile course']);
        $otherUserCourse = Course::factory()->create(['title' => 'Other user course']);

        WalletTopupOrder::create([
            'account_id' => $user->id,
            'profile_id' => $activeProfile->id,
            'package_id' => $package->id,
            'order_code' => 920001,
            'amount_vnd' => 100_000,
            'coins_to_credit' => 120,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
        ]);
        WalletTopupOrder::create([
            'account_id' => $otherUser->id,
            'profile_id' => $otherUserProfile->id,
            'package_id' => $package->id,
            'order_code' => 920002,
            'amount_vnd' => 200_000,
            'coins_to_credit' => 220,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
        ]);
        CourseEnrollmentOrder::create([
            'profile_id' => $activeProfile->id,
            'course_id' => $activeCourse->id,
            'order_code' => 920003,
            'amount_vnd' => 1_000_000,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
        ]);
        CourseEnrollmentOrder::create([
            'profile_id' => $otherProfileSameAccount->id,
            'course_id' => $otherProfileCourse->id,
            'order_code' => 920004,
            'amount_vnd' => 2_000_000,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
        ]);
        CourseEnrollmentOrder::create([
            'profile_id' => $otherUserProfile->id,
            'course_id' => $otherUserCourse->id,
            'order_code' => 920005,
            'amount_vnd' => 3_000_000,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->getJson('/api/v1/me/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->assertEqualsCanonicalizing(['topup', 'course'], array_column($response->json('data'), 'type'));
        $this->assertStringNotContainsString('Other profile course', $response->getContent());
        $this->assertStringNotContainsString('Other user course', $response->getContent());
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
