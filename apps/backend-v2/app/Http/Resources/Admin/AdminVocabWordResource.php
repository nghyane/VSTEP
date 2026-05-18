<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\VocabWord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read VocabWord $resource
 */
class AdminVocabWordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'topic_id' => $this->resource->topic_id,
            'word' => $this->resource->word,
            'phonetic' => $this->resource->phonetic,
            'part_of_speech' => $this->resource->part_of_speech,
            'definition' => $this->resource->definition,
            'example' => $this->resource->example,
            'synonyms' => $this->resource->synonyms ?? [],
            'collocations' => $this->resource->collocations ?? [],
            'word_family' => $this->resource->word_family ?? [],
            'vstep_tip' => $this->resource->vstep_tip,
            'display_order' => $this->resource->display_order,
        ];
    }
}
