<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamVersionListeningItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read ExamVersionListeningItem $resource */
final class AdminMcqItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'display_order' => $this->resource->display_order,
            'stem' => $this->resource->stem,
            'options' => $this->resource->options,
            'correct_index' => $this->resource->correct_index,
        ];
    }
}
