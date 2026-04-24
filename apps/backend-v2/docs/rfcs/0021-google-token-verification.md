---
RFC: 0021
Title: Google ID Token Verification via Official PHP Client
Status: Implemented
Created: 2026-04-24
Updated: 2026-04-24
Superseded by: —
---

# RFC 0021 — Google ID Token Verification via Official PHP Client

## Summary

Backend Google Sign-In should verify ID tokens using Google's official PHP client instead of maintaining hand-rolled JWKS/JWT verification code.

## Motivation

Google's Identity documentation recommends using a Google API client library for production ID token validation. The initial implementation manually fetched JWKS, converted RSA JWK to PEM, and verified signatures. That duplicates security-sensitive logic and already failed project formatting checks.

Using the official client reduces maintenance risk and keeps validation behavior aligned with Google's supported implementation.

## Design

Add Composer dependency:

- `google/apiclient`

`GoogleTokenVerifier` remains the application boundary used by `AuthService`, but internally delegates to:

```php
(new Google\Client(['client_id' => $clientId]))->verifyIdToken($idToken)
```

Application-level checks still enforce required claims used by the domain:

- `sub`
- `email`

`AuthService` continues to reject tokens where `email_verified` is false.

No API contract change.

## Alternatives considered

### Keep manual JWKS verifier

Rejected. It requires maintaining ASN.1/JWK/JWT verification code in app code and increases risk compared with the official client.

### Use Google's tokeninfo endpoint

Rejected for production because it adds a network call per login and is documented mainly for development/debugging.

## Implementation

- [x] Dependency
- [x] Services
- [ ] Tests
