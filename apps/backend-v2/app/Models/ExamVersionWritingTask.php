<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['exam_version_id', 'part', 'task_type', 'duration_minutes', 'prompt', 'min_words', 'instructions', 'display_order'])]
class ExamVersionWritingTask extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['instructions' => 'array'];
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(ExamVersion::class, 'exam_version_id');
    }
}
