<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Confidence;
use App\Enums\PlacementSource;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'source', 'confidence', 'levels', 'estimated_band', 'needs_verification'])]
#[Hidden(['user_id'])]
class UserPlacement extends BaseModel
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'source' => PlacementSource::class,
            'confidence' => Confidence::class,
            'levels' => 'array',
            'needs_verification' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
