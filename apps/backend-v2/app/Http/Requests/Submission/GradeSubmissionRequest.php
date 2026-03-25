<?php

declare(strict_types=1);

namespace App\Http\Requests\Submission;

use App\Enums\VstepBand;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GradeSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'score' => ['required', 'numeric', 'min:0', 'max:10'],
            'band' => ['nullable', 'string', Rule::enum(VstepBand::class)],
            'result' => ['required', 'array'],
            'feedback' => ['nullable', 'string'],
        ];
    }
}
