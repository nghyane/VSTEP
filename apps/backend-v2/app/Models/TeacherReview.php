<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'booking_id', 'teacher_id', 'submission_type', 'submission_id',
    'content', 'visible_to_student',
])]
class TeacherReview extends BaseModel
{
    protected function casts(): array
    {
        return ['content' => 'array', 'visible_to_student' => 'boolean'];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
