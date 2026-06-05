<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
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
    private const LEVEL_SLUG_SUFFIX = '/-(a1|a2|b1|b2|c1)$/i';

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

    /**
     * @return Attribute<string, never>
     */
    protected function groupKey(): Attribute
    {
        return Attribute::get(function (): string {
            $groupKey = preg_replace(self::LEVEL_SLUG_SUFFIX, '', $this->slug);

            return is_string($groupKey) && $groupKey !== '' ? $groupKey : $this->slug;
        });
    }
}
