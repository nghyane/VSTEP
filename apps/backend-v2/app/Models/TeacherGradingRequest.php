<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TeacherGradingRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'attempt_id',
    'profile_id',
    'status',
    'assigned_teacher_id',
    'assigned_by',
    'student_note',
    'staff_note',
    'priority',
    'due_at',
    'requested_at',
    'assigned_at',
    'started_at',
    'completed_at',
    'cancelled_at',
])]
class TeacherGradingRequest extends BaseModel
{
    protected function casts(): array
    {
        return [
            'status' => TeacherGradingRequestStatus::class,
            'priority' => 'integer',
            'due_at' => 'datetime',
            'requested_at' => 'datetime',
            'assigned_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(AssessmentAttempt::class, 'attempt_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function assignedTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_teacher_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function teacherResult(): HasOne
    {
        return $this->hasOne(TeacherGradingResult::class, 'request_id');
    }
}
