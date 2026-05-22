<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdatePointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $pointId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('grammar_points', 'slug')->ignore($pointId),
            ],
            'name' => ['sometimes', 'string', 'max:150'],
            'vietnamese_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'summary' => ['sometimes', 'string'],
            'category' => ['sometimes', 'string', 'in:foundation,sentence,task,error-clinic'],
            'display_order' => ['sometimes', 'integer'],
            'is_published' => ['sometimes', 'boolean'],
            'levels' => ['sometimes', 'array'],
            'levels.*' => ['string', 'in:A2,B1,B2,C1'],
            'tasks' => ['sometimes', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'functions' => ['sometimes', 'array'],
            'functions.*' => ['string', 'max:50'],
        ];
    }
}
