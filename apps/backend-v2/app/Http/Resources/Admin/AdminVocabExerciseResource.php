<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\VocabExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin resource. KHÁC learner resource ở chỗ giữ nguyên `payload`
 * (bao gồm `correct_index` / `accepted_answers`) — admin cần xem để chỉnh.
 *
 * @property-read VocabExercise $resource
 */
class AdminVocabExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'topic_id' => $this->resource->topic_id,
            'kind' => $this->resource->kind,
            'payload' => $this->resource->payload,
            'explanation' => $this->resource->explanation,
            'display_order' => $this->resource->display_order,
        ];
    }
}
