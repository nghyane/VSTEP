<?php

namespace App\Models;

use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'question_id', 'skill', 'status', 'answer', 'result', 'score', 'band', 'feedback', 'completed_at'])]
class Submission extends Model
{
    use HasUuids;

    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'status' => SubmissionStatus::class,
            'answer' => 'array',
            'result' => 'array',
            'score' => 'float',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
