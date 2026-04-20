<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Learner's learning unit. 1 user có n profiles.
 * Wallet (xu), progress, streak, enrollments đều gắn vào profile.
 */
#[Fillable([
    'account_id',
    'nickname',
    'target_level',
    'target_deadline',
    'entry_level',
    'avatar_color',
    'is_initial_profile',
])]
class Profile extends BaseModel
{
    protected function casts(): array
    {
        return [
            'target_deadline' => 'date',
            'is_initial_profile' => 'boolean',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_id');
    }

    public function onboardingResponse(): HasOne
    {
        return $this->hasOne(ProfileOnboardingResponse::class);
    }

    public function resetEvents(): HasMany
    {
        return $this->hasMany(ProfileResetEvent::class);
    }
}
