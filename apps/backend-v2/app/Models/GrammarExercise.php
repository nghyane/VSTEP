<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * Grammar exercise discriminated union.
 * kind ∈ (mcq, error_correction, fill_blank, rewrite).
 */
#[Fillable([
    'grammar_point_id',
    'kind',
    'payload',
    'explanation',
    'display_order',
])]
class GrammarExercise extends BaseModel
{
    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function point(): BelongsTo
    {
        return $this->belongsTo(GrammarPoint::class, 'grammar_point_id');
    }

    /**
     * @param  array<string,mixed>  $answer
     */
    public function isAnswerCorrect(array $answer): bool
    {
        return match ($this->kind) {
            'mcq' => isset($answer['selected_index'])
                && $answer['selected_index'] === ($this->payload['correct_index'] ?? -1),
            'fill_blank' => $this->matchAccepted($answer['text'] ?? null),
            'rewrite' => $this->matchAccepted($answer['text'] ?? null),
            'error_correction' => isset($answer['text'])
                && $this->normalize((string) $answer['text'])
                    === $this->normalize((string) ($this->payload['correction'] ?? '')),
            default => false,
        };
    }

    private function matchAccepted(?string $text): bool
    {
        if ($text === null) {
            return false;
        }
        $normalized = $this->normalize($text);
        $accepted = (array) ($this->payload['accepted_answers'] ?? []);
        foreach ($accepted as $candidate) {
            if ($this->normalize((string) $candidate) === $normalized) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $text): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $text) ?? $text));
    }
}
