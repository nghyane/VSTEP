<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Str;

final class ConversationTurnNormalizer
{
    /**
     * Normalize LLM turn response — reconcile vocab with pre-check.
     *
     * @return array{feedback: array, reply: string, reply_ipa: string|null, suggested_words: string[]}|null
     */
    public function normalize(?array $data, array $targetVocab, string $lowerText, string $userText): ?array
    {
        if (! is_array($data)) {
            return null;
        }

        $feedback = $data['feedback'] ?? null;
        $reply = $data['reply'] ?? null;

        if (! is_array($feedback) || ! is_string($reply)) {
            return null;
        }

        $llmVocab = collect($feedback['vocab_check'] ?? [])->keyBy(
            fn ($v) => Str::lower((string) ($v['phrase'] ?? '')),
        );

        $completeVocab = collect($targetVocab)->map(function ($phrase) use ($llmVocab, $lowerText) {
            $entry = $llmVocab->get(Str::lower($phrase));

            return [
                'phrase' => $phrase,
                'used' => $entry ? (bool) ($entry['used'] ?? false) : Str::contains($lowerText, Str::lower($phrase)),
            ];
        })->toArray();

        $usedCount = count(array_filter($completeVocab, fn ($v) => $v['used']));

        $better = $feedback['better'] ?? '';
        if (empty($better) || $better === $userText) {
            $better = $userText;
        }

        return [
            'feedback' => [
                'word_count' => ['used' => $usedCount, 'target' => count($targetVocab)],
                'grammar_ok' => (bool) ($feedback['grammar_ok'] ?? true),
                'grammar_corrections' => $feedback['grammar_corrections'] ?? [],
                'vocab_check' => $completeVocab,
                'better' => $better,
                'user_ipa' => $feedback['user_ipa'] ?? null,
                'better_ipa' => $feedback['better_ipa'] ?? null,
            ],
            'reply' => $reply,
            'reply_ipa' => $data['reply_ipa'] ?? null,
            'suggested_words' => is_array($data['suggested_words'] ?? null) ? array_values($data['suggested_words']) : [],
        ];
    }
}
