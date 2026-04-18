<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Polymorphic MCQ answer. question_type defines which table question_id points to.
 */
#[Fillable([
    'session_id',
    'question_type',
    'question_id',
    'selected_index',
    'is_correct',
    'answered_at',
])]
class PracticeMcqAnswer extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'answered_at' => 'datetime',
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
}
