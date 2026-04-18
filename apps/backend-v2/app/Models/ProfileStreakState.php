<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['profile_id', 'current_streak', 'longest_streak', 'last_active_date_local'])]
class ProfileStreakState extends Model
{
    use HasFactory;

    protected $table = 'profile_streak_state';

    protected $primaryKey = 'profile_id';

    public $incrementing = false;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['last_active_date_local' => 'date', 'updated_at' => 'datetime'];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }
}
