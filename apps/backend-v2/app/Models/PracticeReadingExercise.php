<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'title',
    'description',
    'part',
    'passage',
    'vietnamese_translation',
    'keywords',
    'estimated_minutes',
    'is_published',
])]
class PracticeReadingExercise extends BaseModel
{
    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PracticeReadingQuestion::class, 'exercise_id');
    }
}
