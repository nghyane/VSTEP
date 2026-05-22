<?php

declare(strict_types=1);

namespace App\Http\Requests\Practice;

use Illuminate\Foundation\Http\FormRequest;

final class SubmitWritingPracticeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'min:1', 'max:5000'],
        ];
    }
}
