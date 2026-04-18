<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'topic_id',
    'word',
    'phonetic',
    'part_of_speech',
    'definition',
    'example',
    'synonyms',
    'collocations',
    'word_family',
    'vstep_tip',
    'display_order',
])]
class VocabWord extends BaseModel
{
    protected function casts(): array
    {
        return [
            'synonyms' => 'array',
            'collocations' => 'array',
            'word_family' => 'array',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(VocabTopic::class, 'topic_id');
    }
}
