<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'profile_id', 'type', 'title', 'body', 'icon_key', 'payload', 'dedup_key', 'read_at',
])]
class Notification extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['payload' => 'array', 'read_at' => 'datetime', 'created_at' => 'datetime'];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }
}
