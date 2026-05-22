<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Grammar;

use Illuminate\Foundation\Http\FormRequest;

/**
 * category ∈ (foundation, sentence, task, error-clinic) — theo migration docblock.
 * levels[] ∈ A2/B1/B2/C1.
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
            'category' => ['required', 'string', 'in:foundation,sentence,task,error-clinic'],
            'display_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
            'levels' => ['nullable', 'array'],
            'levels.*' => ['string', 'in:A2,B1,B2,C1'],
            'tasks' => ['nullable', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
            'functions' => ['nullable', 'array'],
            'functions.*' => ['string', 'max:50'],
        ];
    }
}
