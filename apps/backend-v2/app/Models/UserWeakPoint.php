<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'knowledge_point_id', 'skill', 'ease_factor', 'repetition_count', 'interval_days', 'last_practiced_at', 'next_review_at', 'is_mastered'])]
class UserWeakPoint extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'ease_factor' => 'float',
            'last_practiced_at' => 'datetime',
            'next_review_at' => 'datetime',
            'is_mastered' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function knowledgePoint(): BelongsTo
    {
        return $this->belongsTo(KnowledgePoint::class);
    }

    #[Scope]
    protected function dueForReview(Builder $query): void
    {
        $query->where('is_mastered', false)
            ->where('next_review_at', '<=', now());
    }

    #[Scope]
    protected function forUser(Builder $query, string $userId): void
    {
        $query->where('user_id', $userId);
    }
}
