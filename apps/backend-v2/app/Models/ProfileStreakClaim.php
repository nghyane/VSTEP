<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['account_id', 'profile_id', 'milestone_days', 'coins_granted', 'coin_transaction_id', 'claimed_at'])]
class ProfileStreakClaim extends Model
{
    protected $table = 'profile_streak_claims';

    public $incrementing = false;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'milestone_days' => 'int',
            'coins_granted' => 'int',
            'claimed_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    /**
     * Composite primary key (account_id, milestone_days) — Eloquent mặc định
     * dùng `id`. Override để save()/refresh() match đúng row.
     */
    protected function setKeysForSaveQuery($query): Builder
    {
        return $query
            ->where('account_id', $this->original['account_id'] ?? $this->account_id)
            ->where('milestone_days', $this->original['milestone_days'] ?? $this->milestone_days);
    }

    protected function setKeysForSelectQuery($query): Builder
    {
        return $this->setKeysForSaveQuery($query);
    }
}
