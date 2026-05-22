<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'title',
    'level',
    'character_name',
    'character_voice_label',
    'description',
    'system_prompt',
    'opening_line',
    'target_vocab',
    'estimated_minutes',
    'expected_turns',
    'is_published',
])]
class PracticeSpeakingScenario extends BaseModel
{
    protected function casts(): array
    {
        return [
            'target_vocab' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PracticeSpeakingConversationSession::class, 'scenario_id');
    }
}
