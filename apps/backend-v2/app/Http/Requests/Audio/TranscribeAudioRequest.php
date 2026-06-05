<?php

declare(strict_types=1);

namespace App\Http\Requests\Audio;

use Illuminate\Foundation\Http\FormRequest;

final class TranscribeAudioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'audio' => ['nullable', 'file', 'max:10240'],
            'audio_key' => ['nullable', 'string', 'max:500'],
            'language' => ['nullable', 'string', 'max:20'],
        ];
    }
}
