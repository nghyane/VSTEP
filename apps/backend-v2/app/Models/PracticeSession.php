<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'skill', 'mode', 'level', 'config', 'current_question_id', 'summary', 'started_at', 'completed_at'])]
#[Hidden(['user_id'])]
class PracticeSession extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'mode' => PracticeMode::class,
            'level' => Level::class,
            'config' => 'array',
            'summary' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function currentQuestion(): BelongsTo
    {
        return $this->belongsTo(Question::class, 'current_question_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'practice_session_id');
    }

    #[Scope]
    protected function forUser(Builder $query, string $userId): void
    {
        $query->where('user_id', $userId);
    }

    #[Scope]
    protected function completed(Builder $query): void
    {
        $query->whereNotNull('completed_at');
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function itemsCount(): int
    {
        return $this->config['items_count'] ?? 5;
    }

    public function completedCount(): int
    {
        return $this->submissions()
            ->distinct('question_id')
            ->count('question_id');
    }

    public function hasMoreItems(): bool
    {
        return $this->completedCount() < $this->itemsCount();
    }
}
