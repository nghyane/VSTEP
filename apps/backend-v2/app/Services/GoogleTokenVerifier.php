<?php

declare(strict_types=1);

namespace App\Services;

use Google\Client as GoogleClient;
use RuntimeException;

/**
 * Verifies Google ID tokens using Google's official PHP client.
 *
 * Google recommends the platform client library for production token validation
 * instead of hand-rolled JWKS/JWT verification.
 */
class GoogleTokenVerifier
{
    /**
     * @return array{sub:string,email:string,email_verified:bool,name:?string,picture:?string}
     *
     * @throws RuntimeException when token is invalid, expired, or signature fails.
     */
    public function verify(string $idToken): array
    {
        $clientId = (string) config('services.google.client_id');
        if ($clientId === '') {
            throw new RuntimeException('Google client ID not configured.');
        }

        $payload = (new GoogleClient(['client_id' => $clientId]))->verifyIdToken($idToken);
        if (! is_array($payload)) {
            throw new RuntimeException('Invalid Google ID token.');
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
            throw new RuntimeException('Google ID token missing required claims.');
        }
    }
}
