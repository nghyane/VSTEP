<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ConversationStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeSpeakingConversationSession extends BaseModel
{
    protected $fillable = [
        'profile_id',
        'scenario_id',
        'status',
        'started_at',
        'ended_at',
        'duration_seconds',
        'user_turn_count',
        'vocab_used_count',
        'vocab_target_count',
        'grammar_ok_count',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'status' => ConversationStatus::class,
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(PracticeSpeakingScenario::class, 'scenario_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function turns(): HasMany
    {
        return $this->hasMany(PracticeSpeakingConversationTurn::class, 'session_id')
            ->orderBy('turn_index');
    }
}
