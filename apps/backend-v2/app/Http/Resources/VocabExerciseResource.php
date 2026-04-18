<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VocabExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read VocabExercise $resource
 *
 * Payload được expose nhưng client KHÔNG được tin correct_index —
 * server verify. FE chỉ dùng để render options/sentences.
 */
class VocabExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payload = $this->resource->payload;
        // Remove correct_index from learner response để tránh cheat.
        if (is_array($payload) && isset($payload['correct_index'])) {
            unset($payload['correct_index']);
        }

        return [
            'id' => $this->resource->id,
            'kind' => $this->resource->kind,
            'payload' => $payload,
            'display_order' => $this->resource->display_order,
        ];
    }
}
