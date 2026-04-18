<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\GrammarExercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read GrammarExercise $resource
 *
 * Hide correct_index / correction / accepted_answers from learner payload.
 */
class GrammarExerciseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $payload = $this->resource->payload;
        if (is_array($payload)) {
            unset($payload['correct_index'], $payload['correction'], $payload['accepted_answers']);
        }

        return [
            'id' => $this->resource->id,
            'kind' => $this->resource->kind,
            'payload' => $payload,
            'display_order' => $this->resource->display_order,
        ];
    }
}
