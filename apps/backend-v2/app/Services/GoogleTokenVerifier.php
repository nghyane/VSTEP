<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InvalidGoogleTokenException;
use Google\Client as GoogleClient;

/**
 * Verifies Google ID tokens using Google's official PHP client.
 *
 * The GoogleClient instance is a singleton bound in AppServiceProvider so
 * its internal JWKS cache + Guzzle client are reused across Octane requests.
 */
final class GoogleTokenVerifier
{
    public function __construct(private readonly GoogleClient $client) {}

    /**
     * @return array{sub:string,email:string,email_verified:bool,name:?string,picture:?string}
     *
     * @throws InvalidGoogleTokenException when token is invalid, expired, or signature fails.
     */
    public function verify(string $idToken): array
    {
        $payload = $this->client->verifyIdToken($idToken);
        if (! is_array($payload)) {
            throw new InvalidGoogleTokenException;
        }

        $this->validateRequiredClaims($payload);

        return [
            'sub' => (string) $payload['sub'],
            'email' => (string) $payload['email'],
            'email_verified' => filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'name' => isset($payload['name']) ? (string) $payload['name'] : null,
            'picture' => isset($payload['picture']) ? (string) $payload['picture'] : null,
        ];
    }

    /** @param array<string,mixed> $payload */
    private function validateRequiredClaims(array $payload): void
    {
        if (empty($payload['sub']) || empty($payload['email'])) {
            throw new InvalidGoogleTokenException;
        }
    }
}
