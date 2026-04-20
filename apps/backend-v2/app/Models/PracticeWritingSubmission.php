<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Writing submission. 1 submission → N grading results (Slice 8 versioning).
 * text immutable sau create.
 */
#[Fillable([
    'session_id',
    'profile_id',
    'prompt_id',
    'text',
    'word_count',
    'submitted_at',
])]
class PracticeWritingSubmission extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(PracticeWritingPrompt::class, 'prompt_id');
    }
}
