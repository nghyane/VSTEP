<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'profile_id',
    'content_type',
    'content_id',
    'rating',
    'comment',
])]
class ExerciseFeedback extends BaseModel
{
    protected $table = 'exercise_feedbacks';

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
