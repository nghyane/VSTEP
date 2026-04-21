<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FSRS state cache per (profile, word).
 * Composite primary key. No UUID id.
 * difficulty=0, stability=0 means "new".
 */
#[Fillable([
    'profile_id',
    'word_id',
    'difficulty',
    'stability',
    'lapses',
    'due_at',
    'last_review_at',
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
            'difficulty' => 'float',
            'stability' => 'float',
            'due_at' => 'datetime',
            'last_review_at' => 'datetime',
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
