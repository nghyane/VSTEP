<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['section_id', 'display_order', 'stem', 'options', 'correct_index'])]
class ExamVersionListeningItem extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['options' => 'array'];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(ExamVersionListeningSection::class, 'section_id');
    }
}
