<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateTipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task' => ['sometimes', 'string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'tip' => ['sometimes', 'string'],
            'example' => ['sometimes', 'string'],
            'display_order' => ['sometimes', 'integer'],
        ];
    }
}
