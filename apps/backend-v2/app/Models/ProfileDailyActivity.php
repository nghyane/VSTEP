<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['profile_id', 'date_local', 'drill_session_count', 'drill_duration_seconds'])]
class ProfileDailyActivity extends Model
{
    use HasFactory;

    protected $table = 'profile_daily_activity';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return ['date_local' => 'date', 'updated_at' => 'datetime'];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }
}
