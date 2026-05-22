<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SpeakingTaskDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'part' => $this->part,
            'task_type' => $this->task_type,
            'content' => $this->content,
            'speaking_seconds' => $this->speaking_seconds,
        ];
    }
}
