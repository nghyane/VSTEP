<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['passage_id', 'display_order', 'stem', 'options', 'correct_index'])]
class ExamVersionReadingItem extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['options' => 'array'];
    }

    public function passage(): BelongsTo
    {
        return $this->belongsTo(ExamVersionReadingPassage::class, 'passage_id');
    }
}
