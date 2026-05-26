<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Topup;

use Illuminate\Foundation\Http\FormRequest;

final class StorePackageRequest extends FormRequest
{
    /** Min: 1k VND (avoid spam tiny package). Max: 100M VND (sanity cap). */
    public const MIN_AMOUNT_VND = 1_000;

    public const MAX_AMOUNT_VND = 100_000_000;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:50'],
            'amount_vnd' => ['required', 'integer', 'min:'.self::MIN_AMOUNT_VND, 'max:'.self::MAX_AMOUNT_VND],
            'coins_base' => ['required', 'integer', 'min:1'],
            'bonus_coins' => ['nullable', 'integer', 'min:0'],
            'display_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
            'is_best_value' => ['nullable', 'boolean'],
        ];
    }
}
