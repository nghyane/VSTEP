<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use App\Enums\Skill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PracticeNextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'skill' => ['required', 'string', Rule::enum(Skill::class)],
            'part' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
