<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * kind ∈ (mcq, fill_blank, word_form).
 * Payload shape depends on kind — xem migration docblock.
 */
#[Fillable([
    'topic_id',
    'kind',
    'payload',
    'explanation',
    'display_order',
])]
class VocabExercise extends BaseModel
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(VocabTopic::class, 'topic_id');
    }

    /**
     * Validate user answer against payload. Returns true if correct.
     *
     * @param  array<string,mixed>  $answer
     */
    public function isAnswerCorrect(array $answer): bool
    {
        return match ($this->kind) {
            'mcq' => isset($answer['selected_index'])
                && $answer['selected_index'] === ($this->payload['correct_index'] ?? -1),
            'fill_blank', 'word_form' => $this->matchAcceptedAnswer($answer['text'] ?? null),
            default => false,
        };
    }

    private function matchAcceptedAnswer(?string $text): bool
    {
        if ($text === null) {
            return false;
        }
        $normalized = strtolower(trim($text));
        $accepted = (array) ($this->payload['accepted_answers'] ?? []);
        foreach ($accepted as $candidate) {
            if (strtolower(trim((string) $candidate)) === $normalized) {
                return true;
            }
        }

        return false;
    }
}
