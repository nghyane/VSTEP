<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin array<string, mixed>
 */
final class ExamSessionResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'session' => $this->resource['session'],
            'exam' => $this->resource['exam'],
            'version' => $this->resource['version'],
            'summary' => $this->resource['summary'],
            'review' => $this->resource['review'],
            'mcq_detail' => $this->resource['mcq_detail'],
            'writing_feedback' => $this->resource['writing_feedback'],
            'speaking_feedback' => $this->resource['speaking_feedback'],
            'listening_play_summary' => $this->resource['listening_play_summary'] ?? [],
        ];
    }
}
