<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Enums\VstepLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'nickname' => ['required', 'string', 'max:50'],
            'target_level' => ['required', 'string', Rule::enum(VstepLevel::class)->only(VstepLevel::targetOptions())],
            'target_deadline' => ['required', 'date', 'after:today'],
        ];
    }
}
