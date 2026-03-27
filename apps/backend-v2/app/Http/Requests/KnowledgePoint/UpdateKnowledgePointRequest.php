<?php

declare(strict_types=1);

namespace App\Http\Requests\KnowledgePoint;

use App\Enums\KnowledgePointCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKnowledgePointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['sometimes', 'string', Rule::enum(KnowledgePointCategory::class)],
            'name' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
