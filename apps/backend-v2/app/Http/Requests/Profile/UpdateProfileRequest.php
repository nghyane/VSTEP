<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nickname' => ['sometimes', 'string', 'max:50'],
            'target_level' => ['sometimes', 'string', 'in:B1,B2,C1'],
            'target_deadline' => ['sometimes', 'date', 'after:today'],
            'entry_level' => ['nullable', 'string', 'in:A1,A2,B1,B2,C1'],
        ];
    }
}
