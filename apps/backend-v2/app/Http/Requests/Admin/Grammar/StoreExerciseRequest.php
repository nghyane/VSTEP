<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Grammar exercise discriminated union theo `kind`:
 * - mcq               → payload { prompt, options[4], correct_index }
 * - error_correction  → payload { sentence, error_start, error_end, correction }
 * - fill_blank        → payload { template, accepted_answers[] }
 * - rewrite           → payload { instruction, original, accepted_answers[] }
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
            'kind' => ['required', Rule::in(['mcq', 'error_correction', 'fill_blank', 'rewrite'])],
            'explanation' => ['required', 'string'],
            'display_order' => ['nullable', 'integer'],
            'payload' => ['required', 'array'],

            // mcq
            'payload.prompt' => ['required_if:kind,mcq', 'string'],
            'payload.options' => ['required_if:kind,mcq', 'array', 'size:4'],
            'payload.options.*' => ['required_with:payload.options', 'string'],
            'payload.correct_index' => ['required_if:kind,mcq', 'integer', 'between:0,3'],

            // error_correction
            'payload.sentence' => ['required_if:kind,error_correction', 'string'],
            'payload.error_start' => ['required_if:kind,error_correction', 'integer', 'min:0'],
            'payload.error_end' => ['required_if:kind,error_correction', 'integer', 'min:0'],
            'payload.correction' => ['required_if:kind,error_correction', 'string'],

            // fill_blank
            'payload.template' => ['required_if:kind,fill_blank', 'string'],

            // rewrite
            'payload.instruction' => ['required_if:kind,rewrite', 'string'],
            'payload.original' => ['required_if:kind,rewrite', 'string'],

            // fill_blank + rewrite
            'payload.accepted_answers' => ['required_if:kind,fill_blank,rewrite', 'array', 'min:1'],
            'payload.accepted_answers.*' => ['string'],
        ];
    }
}
