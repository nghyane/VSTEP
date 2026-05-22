<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['exam_id', 'version_number', 'published_at', 'is_active'])]
class ExamVersion extends BaseModel
{
    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'is_active' => 'boolean'];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function listeningSections(): HasMany
    {
        return $this->hasMany(ExamVersionListeningSection::class)
            ->orderBy('part')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    public function readingPassages(): HasMany
    {
        return $this->hasMany(ExamVersionReadingPassage::class)
            ->orderBy('part')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    public function writingTasks(): HasMany
    {
        return $this->hasMany(ExamVersionWritingTask::class)
            ->orderBy('part')
            ->orderBy('display_order')
            ->orderBy('id');
    }

    public function speakingParts(): HasMany
    {
        return $this->hasMany(ExamVersionSpeakingPart::class)
            ->orderBy('part')
            ->orderBy('display_order')
            ->orderBy('id');
    }
}
