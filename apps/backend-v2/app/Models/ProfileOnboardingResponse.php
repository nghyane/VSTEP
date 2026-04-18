<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id',
    'weaknesses',
    'motivation',
    'raw_answers',
    'completed_at',
])]
class ProfileOnboardingResponse extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'weaknesses' => 'array',
            'raw_answers' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
