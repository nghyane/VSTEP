<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_version_id', 'part', 'title', 'duration_minutes', 'passage', 'display_order'])]
class ExamVersionReadingPassage extends BaseModel
{
    public $timestamps = false;

    public function version(): BelongsTo
    {
        return $this->belongsTo(ExamVersion::class, 'exam_version_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExamVersionReadingItem::class, 'passage_id');
    }
}
