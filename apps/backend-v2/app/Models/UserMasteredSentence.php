<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'sentence_id', 'mastered', 'last_reviewed_at'])]
class UserMasteredSentence extends BaseModel
{
    protected function casts(): array
    {
        return [
            'mastered' => 'boolean',
            'last_reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sentence(): BelongsTo
    {
        return $this->belongsTo(SentenceItem::class, 'sentence_id');
    }
}
