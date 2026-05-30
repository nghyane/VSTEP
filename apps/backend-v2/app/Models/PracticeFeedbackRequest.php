<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PracticeFeedbackStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id',
    'submission_type',
    'submission_id',
    'status',
    'coin_transaction_id',
    'last_error',
    'requested_at',
    'completed_at',
    'failed_at',
])]
class PracticeFeedbackRequest extends BaseModel
{
    protected function casts(): array
    {
        return [
            'status' => PracticeFeedbackStatus::class,
            'requested_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function coinTransaction(): BelongsTo
    {
        return $this->belongsTo(CoinTransaction::class);
    }
}
