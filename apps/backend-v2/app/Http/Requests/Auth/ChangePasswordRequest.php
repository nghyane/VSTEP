<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Đổi password của chính tài khoản đang đăng nhập. Phải verify
 * current_password (Laravel rule 'current_password') để chống session
 * hijack — kẻ tấn công lấy được token cũng không đổi được password.
 */
final class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'current_password:api'],
            'new_password' => ['required', 'string', Password::min(8), 'different:current_password'],
        ];
    }
}
