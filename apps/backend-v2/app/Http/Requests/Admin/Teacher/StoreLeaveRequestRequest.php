<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Teacher;

use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;

final class StoreLeaveRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === Role::Teacher;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date', 'after_or_equal:today'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
