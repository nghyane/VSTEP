<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['course_id', 'teacher_id', 'starts_at', 'duration_minutes', 'status'])]
class TeacherSlot extends BaseModel
{
    protected function casts(): array
    {
        return ['starts_at' => 'datetime'];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
