<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'title',
    'description',
    'level',
    'estimated_minutes',
    'is_published',
])]
class PracticeSpeakingDrill extends BaseModel
{
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    public function sentences(): HasMany
    {
        return $this->hasMany(PracticeSpeakingDrillSentence::class, 'drill_id');
    }
}
