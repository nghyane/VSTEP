<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'name',
    'description',
    'level',
    'icon_key',
    'display_order',
    'is_published',
])]
class VocabTopic extends BaseModel
{
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    public function words(): HasMany
    {
        return $this->hasMany(VocabWord::class, 'topic_id');
    }

    public function exercises(): HasMany
    {
        return $this->hasMany(VocabExercise::class, 'topic_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(VocabTopicTask::class, 'topic_id');
    }
}
