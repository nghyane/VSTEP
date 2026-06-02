<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\GradingRubric;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateGradingRubricRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:200'],
            'effective_from' => ['sometimes', 'date'],
            'policy' => ['sometimes', 'array'],
            'policy.assessment_gates' => ['sometimes', 'array'],
            'policy.assessment_gates.severe_minimum_words_task1' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.assessment_gates.severe_minimum_words_task2' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.assessment_gates.minimum_covered_points' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'policy.word_rules' => ['sometimes', 'array'],
            'policy.word_rules.official_minimum_task1' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.word_rules.official_minimum_task2' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.word_rules.short_response_caps' => ['sometimes', 'array', 'max:10'],
            'policy.word_rules.short_response_caps.*.max_words' => ['required_with:policy.word_rules.short_response_caps', 'integer', 'min:1', 'max:1000'],
            'policy.word_rules.short_response_caps.*.cap' => ['required_with:policy.word_rules.short_response_caps', 'numeric', 'min:1', 'max:10'],
            'policy.word_rules.task_fulfillment_word_caps' => ['sometimes', 'array', 'max:10'],
            'policy.word_rules.task_fulfillment_word_caps.*.max_words' => ['required_with:policy.word_rules.task_fulfillment_word_caps', 'integer', 'min:1', 'max:1000'],
            'policy.word_rules.task_fulfillment_word_caps.*.cap' => ['required_with:policy.word_rules.task_fulfillment_word_caps', 'numeric', 'min:1', 'max:10'],
        ];
    }
}
