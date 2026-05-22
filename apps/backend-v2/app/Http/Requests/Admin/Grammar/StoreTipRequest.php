<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

final class StoreTipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task' => ['required', 'string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'tip' => ['required', 'string'],
            'example' => ['required', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
