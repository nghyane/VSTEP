<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\ExamContent;

use Illuminate\Foundation\Http\FormRequest;

final class StoreReadingPassageRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'part' => ['required', 'integer', 'in:1,2,3,4'],
            'title' => ['required', 'string', 'max:200'],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'passage' => ['required', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
