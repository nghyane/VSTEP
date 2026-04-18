<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'slug',
    'title',
    'part',
    'task_type',
    'content',
    'estimated_minutes',
    'speaking_seconds',
    'is_published',
])]
class PracticeSpeakingTask extends BaseModel
{
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
