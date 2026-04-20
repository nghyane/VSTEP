<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'session_id',
    'sentence_id',
    'mode',
    'user_text',
    'accuracy_percent',
    'attempted_at',
])]
class PracticeSpeakingDrillAttempt extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }

    public function sentence(): BelongsTo
    {
        return $this->belongsTo(PracticeSpeakingDrillSentence::class, 'sentence_id');
    }
}
