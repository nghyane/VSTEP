<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slot_id' => ['required', 'uuid'],
            'submission_type' => ['nullable', 'string'],
            'submission_id' => ['nullable', 'uuid'],
        ];
    }
}
