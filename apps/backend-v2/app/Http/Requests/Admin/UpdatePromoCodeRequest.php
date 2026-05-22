<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\PromoCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Sửa promo code. `code` là identity người dùng đã nhớ → block đổi nếu
 * đã có redemption. Các field khác (quota, expires, is_active) cho phép.
 */
final class UpdatePromoCodeRequest extends FormRequest
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
        $id = (string) $this->route('id');

        return [
            'code' => [
                'sometimes',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('promo_codes', 'code')->ignore($id),
            ],
            'partner_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'amount_coins' => ['sometimes', 'integer', 'min:1'],
            'max_total_uses' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'per_account_limit' => ['sometimes', 'integer', 'min:1'],
            'expires_at' => ['sometimes', 'nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->has('code')) {
                return;
            }
            $id = (string) $this->route('id');
            /** @var PromoCode|null $promo */
            $promo = PromoCode::query()->find($id);
            if ($promo === null) {
                return;
            }
            $newCode = strtoupper(trim((string) $this->input('code')));
            if ($newCode === $promo->code) {
                return;
            }
            if ($promo->redemptions()->exists()) {
                $v->errors()->add('code', 'Không thể đổi mã sau khi đã có người dùng quy đổi.');
            }
        });
    }
}
