<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['nullable', 'string', 'regex:/^0\d{9}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'Số điện thoại chỉ được nhập số, gồm đúng 10 chữ số và bắt đầu bằng 0.',
        ];
    }
}
