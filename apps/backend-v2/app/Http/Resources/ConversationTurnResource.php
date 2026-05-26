<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ConversationTurnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $ipa = $this->ipa;
        if (! $ipa && $this->role === 'user' && is_array($this->feedback)) {
            $ipa = $this->feedback['user_ipa'] ?? null;
        }

        return [
            'id' => $this->id,
            'role' => $this->role,
            'text' => $this->text,
            'ipa' => $ipa,
            'feedback' => $this->feedback,
            'suggested_words' => $this->suggested_words ?? [],
        ];
    }
}
