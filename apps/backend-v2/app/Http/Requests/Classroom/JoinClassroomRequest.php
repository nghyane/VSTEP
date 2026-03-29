<?php

declare(strict_types=1);

namespace App\Http\Requests\Classroom;

use Illuminate\Foundation\Http\FormRequest;

class JoinClassroomRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'invite_code' => ['required', 'string'],
        ];
    }
}
