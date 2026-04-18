<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['course_id', 'session_number', 'date', 'start_time', 'end_time', 'topic'])]
class CourseScheduleItem extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['date' => 'date'];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
