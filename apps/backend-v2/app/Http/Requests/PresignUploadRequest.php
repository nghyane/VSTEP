<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Services\UploadService;
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
            'content_type' => ['required', 'string', Rule::in(UploadService::allowedTypes())],
            'file_size' => ['required', 'integer', 'min:1', 'max:'.UploadService::maxFileSize()],
        ];
    }
}
