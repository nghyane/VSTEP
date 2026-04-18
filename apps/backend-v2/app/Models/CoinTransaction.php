<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CoinTransactionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only ledger entry. KHÔNG update sau khi insert.
 * Bigint id vì lịch sử có thể lớn. Không dùng HasUuids.
 */
#[Fillable([
    'profile_id',
    'type',
    'delta',
    'balance_after',
    'source_type',
    'source_id',
    'metadata',
])]
class CoinTransaction extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'type' => CoinTransactionType::class,
            'metadata' => 'array',
            'created_at' => 'datetime',
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
