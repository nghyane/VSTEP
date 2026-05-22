<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Tạo mới user. Role set 1 lần lúc create, sau đó không cho update
 * (theo policy). Admin không được tạo user role=admin qua API — chỉ
 * super-admin seed thủ công.
 */
final class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // middleware role:admin đã enforce
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
            'full_name' => ['nullable', 'string', 'max:255'],
            'role' => ['required', Rule::in([Role::Learner->value, Role::Teacher->value, Role::Staff->value])],
            'title' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string'],
        ];
    }
}
