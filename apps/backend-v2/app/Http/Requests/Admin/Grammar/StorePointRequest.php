<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

/**
 * category ∈ (foundation, sentence, task, writing, error-clinic).
 * levels[] ∈ A1/A2/B1/B2/C1.
 * tasks[] ∈ WT1/WT2/SP1/SP2/SP3/READ.
 * functions[] — free-form string (vd: "expressing time", "comparison").
 */
final class StorePointRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:grammar_points,slug'],
            'name' => ['required', 'string', 'max:150'],
            'vietnamese_name' => ['nullable', 'string', 'max:150'],
            'summary' => ['required', 'string'],
            'learning_objective' => ['nullable', 'string', 'max:1000'],
            'success_criteria' => ['nullable', 'string', 'max:1000'],
            'prerequisite_slugs' => ['nullable', 'array'],
            'prerequisite_slugs.*' => ['string', 'max:80'],
            'cefr_descriptor' => ['nullable', 'string', 'max:1000'],
            'vstep_use_case' => ['nullable', 'string', 'max:1000'],
            'assessed_by' => ['nullable', 'array'],
            'assessed_by.*' => ['string', 'max:80'],
            'is_checkpoint' => ['nullable', 'boolean'],
            'category' => ['required', 'string', 'in:foundation,sentence,task,writing,error-clinic'],
            'display_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
            'levels' => ['nullable', 'array'],
            'levels.*' => ['string', 'in:A1,A2,B1,B2,C1'],
            'tasks' => ['nullable', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'functions' => ['nullable', 'array'],
            'functions.*' => ['string', 'max:50'],
        ];
    }
}
