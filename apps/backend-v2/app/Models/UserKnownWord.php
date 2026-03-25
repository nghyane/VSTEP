<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'word_id', 'known', 'last_reviewed_at'])]
class UserKnownWord extends BaseModel
{
    protected function casts(): array
    {
        return [
            'known' => 'boolean',
            'last_reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function word(): BelongsTo
    {
        return $this->belongsTo(VocabularyWord::class, 'word_id');
    }
}
