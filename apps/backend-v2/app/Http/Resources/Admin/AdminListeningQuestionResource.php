<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PracticeListeningQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin question resource — KHÔNG strip correct_index (khác learner).
 *
 * @property-read PracticeListeningQuestion $resource
 */
class AdminListeningQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'exercise_id' => $this->resource->exercise_id,
            'display_order' => $this->resource->display_order,
            'question' => $this->resource->question,
            'options' => $this->resource->options ?? [],
            'correct_index' => $this->resource->correct_index,
            'explanation' => $this->resource->explanation,
        ];
    }
}
