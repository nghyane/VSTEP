<?php

declare(strict_types=1);

namespace App\Services\Payment;

use Illuminate\Validation\ValidationException;

final class PaymentRedirectUrlResolver
{
    public function trustedUrl(string $field, ?string $url, string $fallback): string
    {
        if ($url === null) {
            return $fallback;
        }

        $origin = $this->urlOrigin($url);
        if ($origin === null) {
            throw ValidationException::withMessages([$field => ['URL chuyển hướng thanh toán không hợp lệ.']]);
        }

        foreach ($this->allowedOrigins() as $allowedOrigin) {
            if (strcasecmp($origin, $allowedOrigin) === 0) {
                return $url;
            }
        }

        throw ValidationException::withMessages([$field => ['URL chuyển hướng thanh toán không được phép.']]);
    }

    /** @return list<string> */
    private function allowedOrigins(): array
    {
        $origins = config('app.payment_redirect_origins', []);
        if (! is_array($origins)) {
            throw new \RuntimeException('app.payment_redirect_origins must be an array.');
        }

        $origins[] = (string) config('app.payment_frontend_url');

        return array_values(array_unique(array_filter(array_map(
            fn (string $origin): ?string => $this->urlOrigin($origin),
            $origins,
        ))));
    }

    private function urlOrigin(string $url): ?string
    {
        $scheme = parse_url($url, PHP_URL_SCHEME);
        $host = parse_url($url, PHP_URL_HOST);
        $port = parse_url($url, PHP_URL_PORT);

        if (! is_string($scheme) || ! is_string($host)) {
            return null;
        }

        $origin = strtolower($scheme).'://'.strtolower($host);

        return is_int($port) ? $origin.':'.$port : $origin;
    }
}
