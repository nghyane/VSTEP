<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SentenceDifficulty;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['topic_id', 'sentence', 'audio_url', 'translation', 'explanation', 'writing_usage', 'difficulty', 'sort_order'])]
class SentenceItem extends BaseModel
{
    protected function casts(): array
    {
        return [
            'difficulty' => SentenceDifficulty::class,
            'sort_order' => 'integer',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(SentenceTopic::class, 'topic_id');
    }
}
