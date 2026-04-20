<?php

declare(strict_types=1);

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class CreateTopupOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_id' => ['required', 'uuid', 'exists:wallet_topup_packages,id'],
            'payment_provider' => ['nullable', 'string', 'in:mock,vnpay,momo'],
        ];
    }
}
