<?php

declare(strict_types=1);

namespace App\Http\Requests\Classroom;

use App\Enums\Skill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendFeedbackRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'to_user_id' => ['required', 'uuid', 'exists:users,id'],
            'content' => ['required', 'string', 'max:2000'],
            'skill' => ['nullable', Rule::enum(Skill::class)],
            'submission_id' => ['nullable', 'uuid', 'exists:submissions,id'],
        ];
    }
}
