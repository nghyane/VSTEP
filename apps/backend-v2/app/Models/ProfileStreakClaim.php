<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['profile_id', 'milestone_days', 'coins_granted', 'coin_transaction_id', 'claimed_at'])]
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
}
