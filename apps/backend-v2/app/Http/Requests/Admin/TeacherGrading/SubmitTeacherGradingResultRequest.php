<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\TeacherGrading;

use Illuminate\Foundation\Http\FormRequest;

final class SubmitTeacherGradingResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'criterion_scores' => ['required', 'array', 'min:1'],
            'criterion_scores.*.key' => ['required', 'string', 'max:80'],
            'criterion_scores.*.score' => ['required', 'numeric', 'min:0', 'max:10'],
            'criterion_scores.*.comment' => ['nullable', 'string', 'max:2000'],
            'feedback' => ['nullable', 'array'],
            'feedback.strengths' => ['nullable', 'array'],
            'feedback.strengths.*' => ['string', 'max:1000'],
            'feedback.improvements' => ['nullable', 'array'],
            'feedback.improvements.*' => ['string', 'max:1000'],
            'feedback.rewrites' => ['nullable', 'array'],
            'feedback.overall_comment' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
