<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * AI service (LLM, STT, IPA generator) is temporarily unavailable.
 * Renders as HTTP 503 with retry hint — FE shows retry button.
 *
 * Distinct from GradingFailedException (queue-level, retried by worker).
 * This one is synchronous user-facing — FE retry UI handles it.
 */
final class AiServiceUnavailableException extends HttpException
{
    public function __construct(string $message = 'AI service tạm thời không phản hồi. Vui lòng thử lại sau.')
    {
        parent::__construct(503, $message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'retry_after' => 5,
        ], 503);
    }
}
