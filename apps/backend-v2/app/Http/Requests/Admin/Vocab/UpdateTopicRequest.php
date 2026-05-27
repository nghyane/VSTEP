<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Vocab;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTopicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $topicId = $this->route('id');

        return [
            'slug' => [
                'sometimes', 'string', 'max:80',
                Rule::unique('vocab_topics', 'slug')->ignore($topicId),
            ],
            'name' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string'],
            'level' => ['sometimes', 'string', 'in:A1,A2,B1,B2,C1'],
            'icon_key' => ['sometimes', 'string', 'max:30'],
            'display_order' => ['sometimes', 'integer'],
            'is_published' => ['sometimes', 'boolean'],
            'tasks' => ['sometimes', 'array'],
            'tasks.*' => ['string', 'in:WT1,WT2,SP1,SP2,SP3,READ'],
        ];
    }
}
