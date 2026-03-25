<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'knowledge_point_ids' => $this->whenLoaded('knowledgePoints', fn () => $this->knowledgePoints->pluck('id')->all()),
        ];
    }
}
