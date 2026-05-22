<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update không cho đổi `kind` (đổi shape payload). Muốn đổi → xoá rồi tạo lại.
 *
 * Validate payload lỏng: chấp nhận mọi sub-field. Service strip key thừa theo
 * kind hiện có khi persist. Tighten validation per-kind sau nếu cần.
 */
final class UpdateExerciseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'explanation' => ['sometimes', 'string'],
            'display_order' => ['sometimes', 'integer'],
            'payload' => ['sometimes', 'array'],

            'payload.prompt' => ['sometimes', 'string'],
            'payload.options' => ['sometimes', 'array', 'size:4'],
            'payload.options.*' => ['required_with:payload.options', 'string'],
            'payload.correct_index' => ['sometimes', 'integer', 'between:0,3'],
            'payload.sentence' => ['sometimes', 'string'],
            'payload.accepted_answers' => ['sometimes', 'array', 'min:1'],
            'payload.accepted_answers.*' => ['string'],
            'payload.instruction' => ['sometimes', 'string'],
            'payload.root_word' => ['sometimes', 'string'],
        ];
    }
}
