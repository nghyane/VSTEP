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
            'policy.severity' => ['sometimes', 'string', 'in:strict,standard,lenient'],
            'policy.word_minimum_task1' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.word_minimum_task2' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'policy.minimum_covered_points' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ];
    }
}
