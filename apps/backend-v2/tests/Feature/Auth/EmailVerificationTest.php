<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_link_marks_account_verified(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHour(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('data.success', true);

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_browser_email_verification_redirects_to_success_screen(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHour(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->get($url)->assertRedirect(config('app.frontend_url').'/?auth=email-verified');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_expired_email_verification_link_returns_json_error(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($url)
            ->assertForbidden()
            ->assertJsonPath('message', 'Liên kết xác thực email không hợp lệ hoặc đã hết hạn.');

        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_browser_expired_email_verification_link_redirects_to_error_screen(): void
    {
        $user = User::factory()->unverified()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->get($url)->assertRedirect('http://localhost:5175/?auth=email-verification-invalid');

        $this->assertNull($user->refresh()->email_verified_at);
    }

    public function test_expired_email_verification_link_for_verified_account_returns_success(): void
    {
        $user = User::factory()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('data.success', true);
    }

    public function test_browser_expired_email_verification_link_for_verified_account_redirects_to_success_screen(): void
    {
        $user = User::factory()->create(['email' => 'learner@example.com']);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->subMinute(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->get($url)->assertRedirect('http://localhost:5175/?auth=email-verified');
    }

    public function test_verified_account_can_login_after_email_verification(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'learner@example.com',
            'password' => 'Secret123',
        ]);
        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addHour(),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($url)->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'Secret123',
        ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['access_token', 'refresh_token']]);
    }

    public function test_resend_email_verification_sends_notification_for_unverified_account(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create(['email' => 'learner@example.com']);

        $this->postJson('/api/v1/auth/email/verification-notification', ['email' => 'learner@example.com'])
            ->assertOk()
            ->assertJsonPath('data.success', true);

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
