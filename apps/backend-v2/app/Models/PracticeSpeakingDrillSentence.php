<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['drill_id', 'display_order', 'text', 'ipa', 'translation', 'word_count', 'audio_start', 'audio_end'])]
class PracticeSpeakingDrillSentence extends BaseModel
{
    public $timestamps = false;

    public function drill(): BelongsTo
    {
        return $this->belongsTo(PracticeSpeakingDrill::class, 'drill_id');
    }
}
