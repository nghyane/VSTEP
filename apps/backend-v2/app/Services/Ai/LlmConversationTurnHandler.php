<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\ConversationTurnHandler;
use App\Exceptions\AiServiceUnavailableException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final class LlmConversationTurnHandler implements ConversationTurnHandler
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function gradeAndReply(string $character, string $systemPrompt, string $level, string $history, string $userText, array $vocabToCheck): array
    {
        $prompt = view('ai.conversation.turn', [
            'character' => $character,
            'systemPrompt' => $systemPrompt,
            'level' => $level,
            'history' => $history,
            'userText' => $userText,
            'vocabCheck' => collect($vocabToCheck)->map(fn ($phrase) => [
                'phrase' => $phrase,
                'pre_match' => false,
            ])->toArray(),
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'conversation',
            prompt: $prompt,
            toolName: 'conversation_turn',
            toolDescription: 'Grade the user turn and reply as the conversation character',
            parametersSchema: $this->turnSchema(),
        );

        $parsed = $this->normalize($structured, $vocabToCheck, $userText);
        if ($parsed === null) {
            Log::warning('ConversationTurn LLM: invalid structure', ['response' => $structured]);
            throw new AiServiceUnavailableException;
        }

        return $parsed;
    }

    /** @return array<string,mixed> */
    private function turnSchema(): array
    {
        return [
            'feedback' => [
                'type' => 'object',
                'properties' => [
                    'vocab_check' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'phrase' => ['type' => 'string'],
                            'used' => ['type' => 'boolean'],
                            'match_type' => ['type' => 'string'],
                        ],
                        'required' => ['phrase', 'used', 'match_type'],
                        'additionalProperties' => false,
                    ]],
                    'grammar_ok' => ['type' => 'boolean'],
                    'grammar_corrections' => ['type' => 'array', 'items' => [
                        'type' => 'object',
                        'properties' => [
                            'wrong' => ['type' => 'string'],
                            'correct' => ['type' => 'string'],
                            'explanation' => ['type' => 'string'],
                        ],
                        'required' => ['wrong', 'correct', 'explanation'],
                        'additionalProperties' => false,
                    ]],
                    'better' => ['type' => 'string'],
                    'user_ipa' => ['type' => 'string'],
                    'better_ipa' => ['type' => 'string'],
                ],
                'required' => ['vocab_check', 'grammar_ok', 'grammar_corrections', 'better', 'user_ipa', 'better_ipa'],
                'additionalProperties' => false,
            ],
            'reply' => ['type' => 'string'],
            'reply_ipa' => ['type' => 'string'],
            'suggested_words' => ['type' => 'array', 'items' => ['type' => 'string']],
        ];
    }

    /**
     * @param  string[]  $targetVocab
     * @return array{feedback: array, reply: string, reply_ipa: string|null, suggested_words: string[]}|null
     */
    private function normalize(?array $data, array $targetVocab, string $userText): ?array
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

        $completeVocab = collect($targetVocab)->map(function ($phrase) use ($llmVocab) {
            $entry = $llmVocab->get(Str::lower($phrase));

            return [
                'phrase' => $phrase,
                'used' => $entry ? (bool) ($entry['used'] ?? false) : false,
                'match_type' => $entry ? ((string) ($entry['match_type'] ?? 'miss')) : 'miss',
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
