<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Tasks ∈ (WT1, WT2, SP1, SP2, SP3, READ) — VSTEP task codes.
 * Level theo CEFR: A2/B1/B2/C1.
 */
class StoreTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:80', 'unique:vocab_topics,slug'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'level' => ['required', 'string', 'in:A2,B1,B2,C1'],
            'icon_key' => ['required', 'string', 'max:30'],
            'display_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
            'tasks' => ['nullable', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
        ];
    }
}
