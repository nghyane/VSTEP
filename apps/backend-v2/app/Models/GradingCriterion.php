<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['rubric_id', 'key', 'name', 'description', 'weight', 'sort_order', 'band_descriptors'])]
class GradingCriterion extends BaseModel
{
    protected function casts(): array
    {
        return [
            'weight' => 'float',
            'band_descriptors' => 'array',
        ];
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(GradingRubric::class, 'rubric_id');
    }
}
