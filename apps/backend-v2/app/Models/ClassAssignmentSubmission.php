<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AssignmentSubmissionStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use App\Models\ExamSession;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['assignment_id', 'user_id', 'exam_session_id', 'answer', 'status', 'score', 'feedback', 'submitted_at', 'late_minutes'])]
#[Hidden(['updated_at'])]
class ClassAssignmentSubmission extends BaseModel
{
    protected function casts(): array
    {
        return [
            'status' => AssignmentSubmissionStatus::class,
            'score' => 'decimal:2',
            'submitted_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(ClassAssignment::class, 'assignment_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }
}
