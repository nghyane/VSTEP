<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only review log. 1 rating event = 1 row.
 * bigint id vì log có thể lớn, không dùng HasUuids.
 */
#[Fillable([
    'profile_id',
    'word_id',
    'session_id',
    'rating',
    'previous_state',
    'new_state',
    'reviewed_at',
])]
class PracticeVocabReview extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'previous_state' => 'array',
            'new_state' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function word(): BelongsTo
    {
        return $this->belongsTo(VocabWord::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }
}
