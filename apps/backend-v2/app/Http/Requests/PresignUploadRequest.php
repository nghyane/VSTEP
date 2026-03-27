<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Services\SpeakingUploadService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PresignUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content_type' => ['required', 'string', Rule::in(SpeakingUploadService::allowedTypes())],
            'file_size' => ['required', 'integer', 'min:1', 'max:'.SpeakingUploadService::maxFileSize()],
        ];
    }
}
