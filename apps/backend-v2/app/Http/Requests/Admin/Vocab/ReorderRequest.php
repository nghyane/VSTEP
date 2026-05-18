<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Reorder children theo mảng id. Mỗi id trong mảng tương ứng với display_order
 * tăng dần (0, 1, 2…). Apply trong 1 transaction.
 */
class ReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'uuid'],
        ];
    }
}
