<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'full_name' => ['nullable', 'string', 'max:255'],

            // Initial profile fields — required at register.
            'nickname' => ['required', 'string', 'max:50'],
            'target_level' => ['required', 'string', 'in:B1,B2,C1'],
            'target_deadline' => ['required', 'date', 'after:today'],
            'entry_level' => ['nullable', 'string', 'in:A1,A2,B1,B2,C1'],
        ];
    }

    /**
     * @return array{email:string,password:string,full_name:string|null}
     */
    public function accountData(): array
    {
        return [
            'email' => $this->validated('email'),
            'password' => $this->validated('password'),
            'full_name' => $this->validated('full_name'),
        ];
    }

    /**
     * @return array{nickname:string,target_level:string,target_deadline:string,entry_level:string|null}
     */
    public function profileData(): array
    {
        return [
            'nickname' => $this->validated('nickname'),
            'target_level' => $this->validated('target_level'),
            'target_deadline' => $this->validated('target_deadline'),
            'entry_level' => $this->validated('entry_level'),
        ];
    }
}
