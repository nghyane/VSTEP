<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\Profile;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery\MockInterface;
use Tests\TestCase;

/**
 * Covers POST /api/v1/auth/google. Google's PHP client is bound as a
 * singleton in AppServiceProvider, so we swap it for a Mockery mock and
 * stub verifyIdToken() \u2014 the rest of GoogleTokenVerifier (claim validation,
 * payload shape) runs for real, giving us coverage of that layer too.
 */
class GoogleLoginTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(array $payload): MockInterface
    {
        return $this->mock(GoogleClient::class, function ($mock) use ($payload) {
            $mock->shouldReceive('verifyIdToken')->andReturn(array_merge([
                'sub' => 'google-123',
                'email' => 'learner@example.com',
                'email_verified' => true,
                'name' => 'New Learner',
                'picture' => null,
            ], $payload));
        });
    }

    public function test_new_google_user_creates_account_and_needs_onboarding(): void
    {
        $this->fakeGoogle([]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertOk();
        $response->assertJsonPath('data.needs_onboarding', true);
        $response->assertJsonPath('data.suggested_nickname', 'New Learner');
        $response->assertJsonPath('data.profile', null);
        $this->assertDatabaseHas('users', [
            'email' => 'learner@example.com',
            'google_id' => 'google-123',
        ]);
    }

    public function test_existing_verified_account_gets_google_id_linked(): void
    {
        $user = User::factory()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('secret'),
            'google_id' => null,
            'full_name' => null,
        ]);
        Profile::factory()->initial()->forAccount($user)->create();

        $this->fakeGoogle([]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertOk();
        $response->assertJsonPath('data.needs_onboarding', false);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => 'google-123',
            'full_name' => 'New Learner',
        ]);
    }

    public function test_unverified_email_blocks_google_login_with_409(): void
    {
        User::factory()->unverified()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('secret'),
        ]);

        $this->fakeGoogle([]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertStatus(409);
        $this->assertDatabaseMissing('users', ['google_id' => 'google-123']);
    }

    public function test_email_not_verified_by_google_is_rejected(): void
    {
        $this->fakeGoogle(['email_verified' => false]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('id_token');
    }

    public function test_deactivated_user_cannot_login_via_google(): void
    {
        $user = User::factory()->create([
            'email' => 'learner@example.com',
            'google_id' => 'google-123',
            'deactivated_at' => now(),
        ]);
        Profile::factory()->initial()->forAccount($user)->create();

        $this->fakeGoogle([]);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('id_token');
    }

    public function test_malformed_token_returns_401(): void
    {
        // google/apiclient throws raw firebase/php-jwt exceptions
        // (UnexpectedValueException etc) for garbage input. Verifier
        // must normalize those to our InvalidGoogleTokenException 401.
        $this->mock(GoogleClient::class, function ($mock) {
            $mock->shouldReceive('verifyIdToken')
                ->andThrow(new \UnexpectedValueException('Wrong number of segments'));
        });

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'not.a.real.jwt']);

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Token Google không hợp lệ.');
    }

    public function test_mixed_case_existing_email_links_to_lowercase_token_email(): void
    {
        // Simulates a user who registered before the email mutator existed
        // (or via an admin tool that wrote mixed case). The User mutator
        // now lowercases on write, but verify the LOWER-normalized lookup
        // still finds them \u2014 and confirms NO duplicate row is created.
        $user = User::factory()->create([
            'email' => 'Learner@Example.com', // mutator normalizes to lowercase
            'password' => Hash::make('secret'),
        ]);
        Profile::factory()->initial()->forAccount($user)->create();

        $this->fakeGoogle(['email' => 'learner@example.com']);

        $response = $this->postJson('/api/v1/auth/google', ['id_token' => 'fake']);

        $response->assertOk();
        $this->assertSame(1, User::where('email', 'learner@example.com')->count());
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'google_id' => 'google-123',
        ]);
    }
}
