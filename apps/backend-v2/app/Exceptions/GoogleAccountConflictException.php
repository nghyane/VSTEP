<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Google login attempted with an email that belongs to an unverified account.
 * Prevents account takeover via email impersonation.
 */
final class GoogleAccountConflictException extends HttpException
{
    public function __construct(
        string $message = 'Email đã được đăng ký nhưng chưa xác thực. Vui lòng đăng nhập bằng mật khẩu trước.',
    ) {
        parent::__construct(409, $message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
