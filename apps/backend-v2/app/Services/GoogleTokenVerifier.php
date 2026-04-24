<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Verifies Google ID tokens (JWT RS256) against Google's public JWKS.
 *
 * Token format: header.payload.signature (base64url). Header declares `kid` and `alg`.
 * We fetch https://www.googleapis.com/oauth2/v3/certs, pick the matching key,
 * convert JWK (n, e) → PEM, and verify signature with openssl_verify.
 * Claims validated: iss (accounts.google.com), aud (our client id), exp, iat.
 */
class GoogleTokenVerifier
{
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const JWKS_CACHE_KEY = 'google:jwks';

    private const JWKS_CACHE_TTL_SECONDS = 3600;

    private const ALLOWED_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

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

        $parts = explode('.', $idToken);
        if (count($parts) !== 3) {
            throw new RuntimeException('Malformed ID token.');
        }
        [$header64, $payload64, $signature64] = $parts;

        $header = $this->decodeJsonSegment($header64);
        $payload = $this->decodeJsonSegment($payload64);
        $signature = $this->base64UrlDecode($signature64);

        if (($header['alg'] ?? null) !== 'RS256') {
            throw new RuntimeException('Unsupported token algorithm.');
        }
        $kid = $header['kid'] ?? null;
        if (! is_string($kid) || $kid === '') {
            throw new RuntimeException('Token header missing kid.');
        }

        $jwk = $this->findKey($kid);
        $publicKeyPem = $this->jwkToPem($jwk);

        $signedInput = $header64.'.'.$payload64;
        $verifyResult = openssl_verify($signedInput, $signature, $publicKeyPem, OPENSSL_ALGO_SHA256);
        if ($verifyResult !== 1) {
            throw new RuntimeException('Invalid token signature.');
        }

        $this->validateClaims($payload, $clientId);

        return [
            'sub' => (string) $payload['sub'],
            'email' => (string) $payload['email'],
            'email_verified' => (bool) ($payload['email_verified'] ?? false),
            'name' => isset($payload['name']) ? (string) $payload['name'] : null,
            'picture' => isset($payload['picture']) ? (string) $payload['picture'] : null,
        ];
    }

    /**
     * @param  array<string,mixed>  $payload
     */
    private function validateClaims(array $payload, string $clientId): void
    {
        $iss = (string) ($payload['iss'] ?? '');
        if (! in_array($iss, self::ALLOWED_ISSUERS, true)) {
            throw new RuntimeException('Invalid token issuer.');
        }

        $aud = $payload['aud'] ?? '';
        if ($aud !== $clientId) {
            throw new RuntimeException('Token audience mismatch.');
        }

        $now = time();
        $exp = (int) ($payload['exp'] ?? 0);
        if ($exp <= $now) {
            throw new RuntimeException('Token expired.');
        }

        $iat = (int) ($payload['iat'] ?? 0);
        if ($iat > $now + 60) {
            throw new RuntimeException('Token issued in the future.');
        }

        if (empty($payload['sub']) || empty($payload['email'])) {
            throw new RuntimeException('Token missing required claims.');
        }
    }

    /**
     * @return array<string,string>
     */
    private function findKey(string $kid): array
    {
        $jwks = $this->fetchJwks();
        foreach ($jwks as $key) {
            if (($key['kid'] ?? null) === $kid) {
                return $key;
            }
        }

        // Cache miss: force refresh once in case Google rotated keys.
        Cache::forget(self::JWKS_CACHE_KEY);
        $jwks = $this->fetchJwks();
        foreach ($jwks as $key) {
            if (($key['kid'] ?? null) === $kid) {
                return $key;
            }
        }

        throw new RuntimeException('No matching Google signing key for kid.');
    }

    /**
     * @return list<array<string,string>>
     */
    private function fetchJwks(): array
    {
        return Cache::remember(self::JWKS_CACHE_KEY, self::JWKS_CACHE_TTL_SECONDS, function () {
            $response = Http::timeout(5)->get(self::JWKS_URL);
            if (! $response->successful()) {
                throw new RuntimeException('Failed to fetch Google JWKS.');
            }
            $body = $response->json();
            if (! is_array($body) || ! isset($body['keys']) || ! is_array($body['keys'])) {
                throw new RuntimeException('Malformed Google JWKS response.');
            }

            return $body['keys'];
        });
    }

    /**
     * Convert JWK (RSA: n, e) to PEM-encoded public key.
     *
     * @param  array<string,string>  $jwk
     */
    private function jwkToPem(array $jwk): string
    {
        if (($jwk['kty'] ?? null) !== 'RSA') {
            throw new RuntimeException('Unsupported JWK key type.');
        }

        $modulus = $this->base64UrlDecode($jwk['n']);
        $exponent = $this->base64UrlDecode($jwk['e']);

        // Build RSA public key ASN.1 DER.
        $modulusComponent = $this->asn1Integer($modulus);
        $exponentComponent = $this->asn1Integer($exponent);
        $rsaPublicKey = $this->asn1Sequence($modulusComponent.$exponentComponent);

        // SPKI wrapper: SEQUENCE { AlgorithmIdentifier, BIT STRING }
        $rsaAlgorithmOid = pack('H*', '300d06092a864886f70d0101010500');
        $bitString = $this->asn1BitString($rsaPublicKey);
        $spki = $this->asn1Sequence($rsaAlgorithmOid.$bitString);

        $pem = "-----BEGIN PUBLIC KEY-----\n";
        $pem .= chunk_split(base64_encode($spki), 64, "\n");
        $pem .= "-----END PUBLIC KEY-----\n";

        return $pem;
    }

    private function asn1Integer(string $value): string
    {
        // Ensure leading byte is not sign bit.
        if (ord($value[0]) > 0x7f) {
            $value = "\x00".$value;
        }

        return "\x02".$this->asn1Length(strlen($value)).$value;
    }

    private function asn1Sequence(string $content): string
    {
        return "\x30".$this->asn1Length(strlen($content)).$content;
    }

    private function asn1BitString(string $content): string
    {
        $bitString = "\x00".$content;

        return "\x03".$this->asn1Length(strlen($bitString)).$bitString;
    }

    private function asn1Length(int $length): string
    {
        if ($length < 0x80) {
            return chr($length);
        }
        $bytes = '';
        while ($length > 0) {
            $bytes = chr($length & 0xff).$bytes;
            $length >>= 8;
        }

        return chr(0x80 | strlen($bytes)).$bytes;
    }

    /**
     * @return array<string,mixed>
     */
    private function decodeJsonSegment(string $segment): array
    {
        $json = $this->base64UrlDecode($segment);
        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('Malformed token segment.');
        }

        return $decoded;
    }

    private function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder > 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        if ($decoded === false) {
            throw new RuntimeException('Invalid base64url encoding.');
        }

        return $decoded;
    }
}
