<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Grammar practice uses selected answers only:
 * - mcq → payload { prompt, options[4], correct_index }
 */
final class StoreExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['mcq'])],
            'explanation' => ['required', 'string'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
            'payload' => ['required', 'array'],

            // mcq
            'payload.prompt' => ['required_if:kind,mcq', 'string'],
            'payload.options' => ['required_if:kind,mcq', 'array', 'size:4'],
            'payload.options.*' => ['required_with:payload.options', 'string'],
            'payload.correct_index' => ['required_if:kind,mcq', 'integer', 'between:0,3'],

        ];
    }
}
