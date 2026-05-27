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
            'learning_objective' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'success_criteria' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'prerequisite_slugs' => ['sometimes', 'nullable', 'array'],
            'prerequisite_slugs.*' => ['string', 'max:80'],
            'cefr_descriptor' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'vstep_use_case' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'assessed_by' => ['sometimes', 'nullable', 'array'],
            'assessed_by.*' => ['string', 'max:80'],
            'is_checkpoint' => ['sometimes', 'boolean'],
            'category' => ['sometimes', 'string', 'in:foundation,sentence,task,writing,error-clinic'],
            'display_order' => ['sometimes', 'integer'],
            'is_published' => ['sometimes', 'boolean'],
            'levels' => ['sometimes', 'array'],
            'levels.*' => ['string', 'in:A1,A2,B1,B2,C1'],
            'tasks' => ['sometimes', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'functions' => ['sometimes', 'array'],
            'functions.*' => ['string', 'max:50'],
        ];
    }
}
