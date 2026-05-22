<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bulk-generate slot pattern. Ví dụ: từ 2026-06-01 → 2026-06-28, các thứ {2, 4, 6},
 * giờ bắt đầu {"19:00", "19:30", "20:00"}, mỗi slot 30 phút → BE tự rải.
 */
final class BulkStoreSlotsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            // 0=CN, 1=T2, ..., 6=T7 (theo Carbon dayOfWeek).
            'weekdays' => ['required', 'array', 'min:1', 'max:7'],
            'weekdays.*' => ['integer', 'min:0', 'max:6'],
            // Mỗi entry là một slot trong ngày.
            'times' => ['required', 'array', 'min:1', 'max:20'],
            'times.*' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:180'],
        ];
    }
}
