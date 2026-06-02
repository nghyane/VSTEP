<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_notification(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'learner@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'learner@example.com'])
            ->assertOk()
            ->assertJsonPath('data.success', true);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_does_not_expose_missing_email(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.com'])
            ->assertOk()
            ->assertJsonPath('data.success', true);

        Notification::assertNothingSent();
    }

    public function test_forgot_password_rejects_google_only_account(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'google@example.com',
            'google_id' => 'google-subject-id',
            'password' => null,
        ]);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'google@example.com'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        Notification::assertNotSentTo($user, ResetPassword::class);
    }

    public function test_reset_password_updates_account_password(): void
    {
        Notification::fake();
        $user = User::factory()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('OldSecret123'),
        ]);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'learner@example.com'])->assertOk();

        $token = null;
        Notification::assertSentTo(
            $user,
            ResetPassword::class,
            function (ResetPassword $notification) use (&$token): bool {
                $token = $notification->token;

                return true;
            },
        );

        $this->assertIsString($token);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'learner@example.com',
            'token' => $token,
            'password' => 'NewSecret123',
            'password_confirmation' => 'NewSecret123',
        ])
            ->assertOk()
            ->assertJsonPath('data.success', true);

        $this->assertTrue(Hash::check('NewSecret123', $user->refresh()->password));
    }
}
