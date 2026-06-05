<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class GrammarPattern extends Model
{
    protected $fillable = [
        'key',
        'label',
        'level',
        'category',
        'pattern_type',
        'pattern',
        'skill',
        'weight',
        'source',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @param Builder<GrammarPattern> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
