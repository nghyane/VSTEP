<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SrsStateKind;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cache current Anki state per (profile, word).
 * Composite primary key. Không UUID id.
 * Source of truth: practice_vocab_reviews.
 */
#[Fillable([
    'profile_id',
    'word_id',
    'state_kind',
    'due_at',
    'interval_days',
    'ease_factor',
    'lapses',
    'remaining_steps',
    'review_interval_days',
    'review_ease_factor',
])]
class ProfileVocabSrsState extends Model
{
    use HasFactory;

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return [
            'state_kind' => SrsStateKind::class,
            'due_at' => 'datetime',
            'ease_factor' => 'float',
            'review_ease_factor' => 'float',
            'updated_at' => 'datetime',
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
}
