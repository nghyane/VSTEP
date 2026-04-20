<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['prompt_id', 'title', 'content', 'display_order'])]
class PracticeWritingTemplateSection extends BaseModel
{
    public $timestamps = false;

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(PracticeWritingPrompt::class, 'prompt_id');
    }
}
