<?php

declare(strict_types=1);

namespace App\Http\Requests\Sentence;

use Illuminate\Foundation\Http\FormRequest;

class ToggleSentenceMasteredRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mastered' => ['required', 'boolean'],
        ];
    }
}
