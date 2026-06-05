<?php

declare(strict_types=1);

namespace App\Http\Requests\Audio;

use Illuminate\Foundation\Http\FormRequest;

final class PresignDownloadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audio_key' => ['required', 'string', 'max:500'],
        ];
    }
}
