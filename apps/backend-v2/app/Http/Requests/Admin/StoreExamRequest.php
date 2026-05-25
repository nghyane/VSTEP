<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

final class StoreExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:100', 'unique:exams,slug'],
            'title' => ['required', 'string', 'max:200'],
            'source_school' => ['nullable', 'string', 'max:100'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'total_duration_minutes' => ['required', 'integer', 'min:1'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
