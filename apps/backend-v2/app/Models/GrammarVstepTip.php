<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['grammar_point_id', 'task', 'tip', 'example', 'display_order'])]
class GrammarVstepTip extends BaseModel
{
    public $timestamps = false;

    public function point(): BelongsTo
    {
        return $this->belongsTo(GrammarPoint::class, 'grammar_point_id');
    }
}
