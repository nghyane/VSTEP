<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nickname' => ['sometimes', 'string', 'max:50'],
            'target_level' => ['sometimes', 'string', 'in:B1,B2,C1'],
            'target_deadline' => ['sometimes', 'date', 'after:today'],
            'entry_level' => ['nullable', 'string', 'in:A1,A2,B1,B2,C1'],
        ];
    }

    /**
     * Reject changes to target_level after profile creation.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $profile = $this->route('profile');
            if ($profile instanceof Profile
                && $this->has('target_level')
                && $this->input('target_level') !== $profile->target_level) {
                $validator->errors()->add(
                    'target_level',
                    'Target level is immutable. Create a new profile to change target.',
                );
            }
        });
    }
}
