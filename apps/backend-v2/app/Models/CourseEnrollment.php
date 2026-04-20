<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id', 'course_id', 'enrolled_at', 'coins_paid',
    'bonus_coins_received', 'acknowledged_commitment', 'coin_transaction_id',
])]
class CourseEnrollment extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['enrolled_at' => 'datetime', 'acknowledged_commitment' => 'boolean'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
