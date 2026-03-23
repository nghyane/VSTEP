<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'skill' => $this->skill,
            'level' => $this->level,
            'part' => $this->part,
            'topic' => $this->topic,
            'content' => $this->content,
            'answer_key' => $this->answer_key,
            'explanation' => $this->explanation,
            'is_active' => $this->is_active,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            'knowledge_point_ids' => $this->whenLoaded('knowledgePoints', fn () => $this->knowledgePoints->pluck('id')),
        ];
    }
}
