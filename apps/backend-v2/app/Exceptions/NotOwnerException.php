<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Resource ownership violation. Auto-renders as 403 JSON via HttpException.
 * Service layer throw this — không gọi abort() trực tiếp.
 */
final class NotOwnerException extends HttpException
{
    public function __construct(string $message = 'Resource does not belong to current profile.')
    {
        parent::__construct(403, $message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 403);
    }
}
