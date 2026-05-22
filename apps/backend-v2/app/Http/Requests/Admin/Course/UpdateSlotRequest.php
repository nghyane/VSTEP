<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateSlotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Không cho phép move slot về quá khứ — service đã chặn slot có booking, còn
            // slot trống vẫn cần guard này để tránh admin gõ nhầm ngày cũ.
            'starts_at' => ['sometimes', 'date', 'after:now'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:180'],
        ];
    }
}
