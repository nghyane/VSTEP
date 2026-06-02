<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class LexicalSignal extends Model
{
    protected $fillable = [
        'phrase',
        'type',
        'category',
        'level',
        'weight',
        'skill',
        'task_type',
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

    /** @param Builder<LexicalSignal> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
