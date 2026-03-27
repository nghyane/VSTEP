<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['topic_id', 'word', 'phonetic', 'audio_url', 'part_of_speech', 'definition', 'explanation', 'examples', 'sort_order'])]
class VocabularyWord extends BaseModel
{
    protected function casts(): array
    {
        return [
            'examples' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(VocabularyTopic::class, 'topic_id');
    }
}
