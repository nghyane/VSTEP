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
    'audio_url',
    'transcript',
    'vietnamese_transcript',
    'word_timestamps',
    'keywords',
    'estimated_minutes',
    'is_published',
])]
class PracticeListeningExercise extends BaseModel
{
    protected function casts(): array
    {
        return [
            'word_timestamps' => 'array',
            'keywords' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function questions(): HasMany
    {
        return $this->hasMany(PracticeListeningQuestion::class, 'exercise_id');
    }
}
