<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateAvatarRequest extends FormRequest
{
    private const AVATAR_KEYS = [
        'Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan',
        'Taylor', 'Drew', 'Quinn', 'Avery', 'Blake', 'Cameron',
        'Dakota', 'Emery', 'Finley', 'Hayden', 'Indigo', 'Jesse',
        'Kai', 'Logan', 'Mason', 'Noah', 'Oakley', 'Parker',
        'Reese', 'Sage', 'Skyler', 'Tatum', 'Winter', 'Zion',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar_key' => ['required', 'string', Rule::in(self::AVATAR_KEYS)],
        ];
    }
}
