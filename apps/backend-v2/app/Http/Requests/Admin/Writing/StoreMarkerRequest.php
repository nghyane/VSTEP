<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Writing;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Sample markers — annotation overlay trên sample_answer.
 * side ∈ (left, right) — chỉ định phía render annotation trong UI.
 * color ∈ HEX hoặc semantic key (vd "blue", "green").
 */
final class StoreMarkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'match' => ['required', 'string'],
            'occurrence' => ['nullable', 'integer', 'min:1'],
            'side' => ['required', 'string', 'in:left,right'],
            'color' => ['required', 'string', 'max:20'],
            'label' => ['required', 'string', 'max:100'],
            'detail' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer'],
        ];
    }
}
