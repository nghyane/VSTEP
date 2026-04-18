<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id',
    'exercise_id',
    'session_id',
    'answer',
    'is_correct',
    'attempted_at',
])]
class PracticeVocabExerciseAttempt extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'answer' => 'array',
            'is_correct' => 'boolean',
            'attempted_at' => 'datetime',
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

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(VocabExercise::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }
}
