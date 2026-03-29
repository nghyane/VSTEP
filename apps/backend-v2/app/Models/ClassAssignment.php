<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AssignmentType;
use App\Enums\Skill;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['classroom_id', 'title', 'description', 'content', 'audio_url', 'skill', 'type', 'exam_id', 'due_date', 'allow_retry'])]
#[Hidden(['updated_at'])]
class ClassAssignment extends BaseModel
{
    protected function casts(): array
    {
        return [
            'skill' => Skill::class,
            'type' => AssignmentType::class,
            'due_date' => 'datetime',
            'allow_retry' => 'boolean',
        ];
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class, 'classroom_id');
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ClassAssignmentSubmission::class, 'assignment_id');
    }
}
