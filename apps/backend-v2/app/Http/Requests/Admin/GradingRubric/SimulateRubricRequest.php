<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\GradingRubric;

use Illuminate\Foundation\Http\FormRequest;

final class SimulateRubricRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['required', 'integer', 'in:1,2'],
            'word_count' => ['required', 'integer', 'min:0', 'max:10000'],
            'covered_points' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'scores' => ['sometimes', 'array'],
            'scores.task_fulfillment' => ['sometimes', 'numeric', 'min:0', 'max:10'],
            'scores.organization' => ['sometimes', 'numeric', 'min:0', 'max:10'],
            'scores.grammar' => ['sometimes', 'numeric', 'min:0', 'max:10'],
            'scores.vocabulary' => ['sometimes', 'numeric', 'min:0', 'max:10'],
        ];
    }
}
