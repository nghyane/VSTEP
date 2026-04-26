<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable(['slug', 'title', 'source_school', 'tags', 'total_duration_minutes', 'is_published'])]
class Exam extends BaseModel
{
    protected function casts(): array
    {
        return ['tags' => 'array', 'is_published' => 'boolean'];
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ExamVersion::class);
    }

    /** Sessions across all versions of this exam. Used for attempts_count. */
    public function sessions(): HasManyThrough
    {
        return $this->hasManyThrough(
            ExamSession::class,
            ExamVersion::class,
            'exam_id',
            'exam_version_id',
        );
    }

    public function activeVersion(): ?ExamVersion
    {
        return $this->versions()->where('is_active', true)->first();
    }
}
