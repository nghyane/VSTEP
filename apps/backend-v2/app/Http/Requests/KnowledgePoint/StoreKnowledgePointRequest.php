<?php

namespace App\Http\Requests\KnowledgePoint;

use App\Enums\KnowledgePointCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKnowledgePointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => ['required', 'string', Rule::enum(KnowledgePointCategory::class)],
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
