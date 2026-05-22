<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Google ID token verification failed.
 * Auto-renders as 401 JSON via HttpException.
 */
final class InvalidGoogleTokenException extends HttpException
{
    public function __construct(string $message = 'Token Google không hợp lệ.')
    {
        parent::__construct(401, $message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 401);
    }
}
