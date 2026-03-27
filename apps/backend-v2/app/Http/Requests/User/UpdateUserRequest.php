<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['sometimes', 'string', 'email', 'max:255'],
            'full_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
