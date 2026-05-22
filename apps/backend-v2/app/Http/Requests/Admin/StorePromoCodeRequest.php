<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Tạo mới promo code. `code` được normalize uppercase trước khi check
 * unique để tránh collision case-insensitive (BABA01 ≡ baba01).
 */
final class StorePromoCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge(['code' => strtoupper(trim((string) $this->input('code')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'min:4', 'max:50', 'regex:/^[A-Z0-9_-]+$/', 'unique:promo_codes,code'],
            'partner_name' => ['nullable', 'string', 'max:100'],
            'amount_coins' => ['required', 'integer', 'min:1'],
            'max_total_uses' => ['nullable', 'integer', 'min:1'],
            'per_account_limit' => ['required', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'Mã chỉ chấp nhận chữ in hoa, số, dấu - và _.',
        ];
    }
}
