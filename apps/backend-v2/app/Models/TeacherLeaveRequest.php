<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LeaveRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['teacher_id', 'date', 'reason', 'status', 'reviewed_by', 'reviewed_at'])]
class TeacherLeaveRequest extends BaseModel
{
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'reviewed_at' => 'datetime',
            'status' => LeaveRequestStatus::class,
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
