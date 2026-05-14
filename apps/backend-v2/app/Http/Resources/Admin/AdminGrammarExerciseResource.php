<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\GrammarExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin resource — giữ nguyên payload đầy đủ (gồm correct_index / correction
 * / accepted_answers) để admin sửa. Khác learner resource.
 *
 * @property-read GrammarExercise $resource
 */
class AdminGrammarExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'grammar_point_id' => $this->resource->grammar_point_id,
            'kind' => $this->resource->kind,
            'payload' => $this->resource->payload,
            'explanation' => $this->resource->explanation,
            'display_order' => $this->resource->display_order,
        ];
    }
}
