<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Enums\VstepBand;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'session_id', 'practice_session_id', 'question_id', 'skill', 'status', 'answer', 'result', 'score', 'band', 'feedback', 'completed_at'])]
class Submission extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'status' => SubmissionStatus::class,
            'band' => VstepBand::class,
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'session_id');
    }

    public function practiceSession(): BelongsTo
    {
        return $this->belongsTo(PracticeSession::class);
    }

    #[Scope]
    protected function forUser(Builder $query, string $userId): void
    {
        $query->where('user_id', $userId);
    }

    #[Scope]
    protected function completed(Builder $query): void
    {
        $query->where('status', SubmissionStatus::Completed);
    }

    #[Scope]
    protected function scored(Builder $query): void
    {
        $query->whereIn('status', [SubmissionStatus::Completed, SubmissionStatus::ReviewPending])
            ->whereNotNull('score');
    }
}
