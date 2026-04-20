<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'prompt_id',
    'match',
    'occurrence',
    'side',
    'color',
    'label',
    'detail',
    'display_order',
])]
class PracticeWritingSampleMarker extends BaseModel
{
    public $timestamps = false;

    public function prompt(): BelongsTo
    {
        return $this->belongsTo(PracticeWritingPrompt::class, 'prompt_id');
    }
}
