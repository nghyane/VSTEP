<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Course;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Chỉ chấp nhận Google Meet hoặc Zoom — tránh admin paste nhầm tracking link,
            // link nội bộ test, hay link malicious.
            'meet_url' => [
                'sometimes', 'nullable', 'url', 'max:500',
                'regex:/^https:\/\/(meet\.google\.com|[a-z0-9-]+\.zoom\.us|zoom\.us)\//i',
            ],
        ];
    }
}
