<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'exercise_id',
    'display_order',
    'question',
    'options',
    'correct_index',
    'explanation',
])]
class PracticeListeningQuestion extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(PracticeListeningExercise::class, 'exercise_id');
    }
}
