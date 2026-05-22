<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ConversationHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $vocabPct = $this->vocab_target_count > 0
            ? (int) round($this->vocab_used_count / $this->vocab_target_count * 100)
            : 0;

        return [
            'id' => $this->id,
            'scenario' => [
                'id' => $this->scenario->id,
                'title' => $this->scenario->title,
                'level' => $this->scenario->level,
            ],
            'ended_at' => $this->ended_at,
            'duration_seconds' => $this->duration_seconds,
            'user_turn_count' => $this->user_turn_count,
            'vocab_used_pct' => $vocabPct,
        ];
    }
}
