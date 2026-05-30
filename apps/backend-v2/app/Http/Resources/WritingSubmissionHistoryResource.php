<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PracticeWritingSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read PracticeWritingSubmission $resource
 */
final class WritingSubmissionHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $result = $this->resource->assessmentAttempt?->result;

        return [
            'id' => $this->resource->id,
            'submitted_at' => $this->resource->submitted_at,
            'word_count' => $this->resource->word_count,
            'overall_band' => $result?->overall_band,
            'grading_status' => $result !== null ? 'ready' : 'pending',
            'prompt' => $this->whenLoaded('prompt', fn () => [
                'id' => $this->resource->prompt->id,
                'slug' => $this->resource->prompt->slug,
                'title' => $this->resource->prompt->title,
                'part' => $this->resource->prompt->part,
            ]),
        ];
    }
}
