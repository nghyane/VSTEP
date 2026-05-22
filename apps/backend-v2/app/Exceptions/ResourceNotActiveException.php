<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Resource is not in a valid state for the requested operation
 * (vd: submit session đã ended, attempt sentence của drill chưa start, ...).
 * Auto-renders as 409 JSON.
 */
final class ResourceNotActiveException extends HttpException
{
    public function __construct(string $message = 'Resource is not active.')
    {
        parent::__construct(409, $message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
