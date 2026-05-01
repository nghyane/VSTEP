<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

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
