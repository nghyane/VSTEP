<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Teacher;

use App\Enums\LeaveRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateLeaveRequestStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in([LeaveRequestStatus::Approved->value, LeaveRequestStatus::Rejected->value])],
        ];
    }
}
