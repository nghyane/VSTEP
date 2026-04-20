<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\VocabWord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read VocabWord $resource
 */
class VocabWordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'word' => $this->resource->word,
            'phonetic' => $this->resource->phonetic,
            'part_of_speech' => $this->resource->part_of_speech,
            'definition' => $this->resource->definition,
            'example' => $this->resource->example,
            'synonyms' => $this->resource->synonyms ?? [],
            'collocations' => $this->resource->collocations ?? [],
            'word_family' => $this->resource->word_family ?? [],
            'vstep_tip' => $this->resource->vstep_tip,
        ];
    }
}
