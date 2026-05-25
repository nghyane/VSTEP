<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateReadingPassageRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['sometimes', 'integer', 'in:1,2,3,4'],
            'title' => ['sometimes', 'string', 'max:200'],
            'duration_minutes' => ['sometimes', 'integer', 'min:1'],
            'passage' => ['sometimes', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
