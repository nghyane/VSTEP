<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $summary = (new ExamSummaryResource($this->resource))->toArray($request);

        return [
            ...parent::toArray($request),
            'sections' => $summary['sections'],
        ];
    }
}
