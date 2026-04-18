<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['exam_version_id', 'part', 'type', 'duration_minutes', 'speaking_seconds', 'content', 'display_order'])]
class ExamVersionSpeakingPart extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(ExamVersion::class, 'exam_version_id');
    }
}
