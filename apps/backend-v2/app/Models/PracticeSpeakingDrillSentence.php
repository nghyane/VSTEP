<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['drill_id', 'display_order', 'text', 'translation'])]
class PracticeSpeakingDrillSentence extends BaseModel
{
    public $timestamps = false;

    public function drill(): BelongsTo
    {
        return $this->belongsTo(PracticeSpeakingDrill::class, 'drill_id');
    }
}
