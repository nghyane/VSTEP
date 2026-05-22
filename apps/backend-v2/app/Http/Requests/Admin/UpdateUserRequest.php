<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Sửa user. Tuyệt đối không cho update `email` (identity) và `role`
 * (chính sách: role chỉ set lúc create). Password cũng không sửa ở đây
 * — admin reset bằng endpoint riêng để rotate token.
 */
final class UpdateUserRequest extends FormRequest
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
            'full_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bio' => ['sometimes', 'nullable', 'string'],
            'avatar_key' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
