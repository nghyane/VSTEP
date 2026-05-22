<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Deactivate teacher có khóa active phải kèm reassignments — admin pick
 * giáo viên mới cho từng course đang chạy. Course đã hết hạn không cần.
 */
final class DeactivateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reassignments' => ['sometimes', 'array'],
            'reassignments.*.course_id' => ['required', 'uuid', Rule::exists('courses', 'id')],
            'reassignments.*.new_teacher_id' => ['required', 'uuid', Rule::exists('users', 'id')],
        ];
    }
}
