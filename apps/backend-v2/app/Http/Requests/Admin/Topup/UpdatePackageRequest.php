<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Topup;

use Illuminate\Foundation\Http\FormRequest;

final class UpdatePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['sometimes', 'required', 'string', 'max:50'],
            'amount_vnd' => [
                'sometimes',
                'required',
                'integer',
                'min:'.StorePackageRequest::MIN_AMOUNT_VND,
                'max:'.StorePackageRequest::MAX_AMOUNT_VND,
            ],
            'coins_base' => ['sometimes', 'required', 'integer', 'min:1'],
            'bonus_coins' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'display_order' => ['sometimes', 'nullable', 'integer'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
            'is_best_value' => ['sometimes', 'nullable', 'boolean'],
        ];
    }
}
