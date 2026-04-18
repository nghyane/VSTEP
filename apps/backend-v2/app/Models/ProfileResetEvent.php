<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Bigint id vì chỉ là audit log. Không dùng HasUuids.
 */
#[Fillable([
    'profile_id',
    'reason',
    'wiped_entities',
    'reset_at',
])]
class ProfileResetEvent extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'wiped_entities' => 'array',
            'reset_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
