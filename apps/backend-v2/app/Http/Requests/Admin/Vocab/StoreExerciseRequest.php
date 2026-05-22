<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Discriminated union theo `kind`:
 * - mcq         → payload { prompt, options[4], correct_index }
 * - fill_blank  → payload { sentence, accepted_answers[] }
 * - word_form   → payload { instruction, sentence, root_word, accepted_answers[] }
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
            'kind' => ['required', Rule::in(['mcq', 'fill_blank', 'word_form'])],
            'explanation' => ['required', 'string'],
            'display_order' => ['nullable', 'integer'],
            'payload' => ['required', 'array'],

            // mcq
            'payload.prompt' => ['required_if:kind,mcq', 'string'],
            'payload.options' => ['required_if:kind,mcq', 'array', 'size:4'],
            'payload.options.*' => ['required_with:payload.options', 'string'],
            'payload.correct_index' => ['required_if:kind,mcq', 'integer', 'between:0,3'],

            // fill_blank
            'payload.sentence' => ['required_if:kind,fill_blank,word_form', 'string'],
            'payload.accepted_answers' => [
                'required_if:kind,fill_blank,word_form',
                'array', 'min:1',
            ],
            'payload.accepted_answers.*' => ['string'],

            // word_form
            'payload.instruction' => ['required_if:kind,word_form', 'string'],
            'payload.root_word' => ['required_if:kind,word_form', 'string'],
        ];
    }
}
