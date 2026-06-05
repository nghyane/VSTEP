<?php

declare(strict_types=1);

namespace App\Http\Requests\Course;

use App\Enums\PaymentProvider;
use Illuminate\Foundation\Http\FormRequest;

final class CreateEnrollmentOrderRequest extends FormRequest
{
    private const MAX_SIGNATURE_LENGTH = 65_535;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_provider' => ['required', 'string', 'in:'.implode(',', PaymentProvider::values())],
            'return_url' => ['required', 'url'],
            'cancel_url' => ['required', 'url'],
            'commitment_signature' => ['required', 'string', 'starts_with:<svg', 'max:'.self::MAX_SIGNATURE_LENGTH],
        ];
    }
}
