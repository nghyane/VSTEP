<?php

declare(strict_types=1);

namespace App\Http\Requests\Wallet;

use App\Enums\PaymentProvider;
use Illuminate\Foundation\Http\FormRequest;

final class CreateTopupOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'package_id' => ['required', 'uuid', 'exists:wallet_topup_packages,id'],
            'payment_provider' => ['required', 'string', 'in:'.implode(',', PaymentProvider::values())],
            'return_url' => ['nullable', 'string', 'url'],
        ];
    }
}
