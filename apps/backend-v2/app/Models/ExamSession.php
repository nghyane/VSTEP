<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SessionStatus;
use App\Enums\VstepBand;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'exam_id', 'status', 'listening_score', 'reading_score', 'writing_score', 'speaking_score', 'overall_score', 'overall_band', 'started_at', 'completed_at'])]
class ExamSession extends BaseModel
{
    protected function casts(): array
    {
        return [
            'status' => SessionStatus::class,
            'overall_band' => VstepBand::class,
            'listening_score' => 'float',
            'reading_score' => 'float',
            'writing_score' => 'float',
            'speaking_score' => 'float',
            'overall_score' => 'float',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class, 'session_id');
    }

    #[Scope]
    protected function forUser(Builder $query, string $userId): void
    {
        $query->where('user_id', $userId);
    }

    #[Scope]
    protected function inProgress(Builder $query): void
    {
        $query->where('status', SessionStatus::InProgress);
    }

    #[Scope]
    protected function completed(Builder $query): void
    {
        $query->where('status', SessionStatus::Completed);
    }
}
