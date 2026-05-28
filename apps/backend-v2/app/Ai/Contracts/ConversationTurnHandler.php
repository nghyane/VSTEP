<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface ConversationTurnHandler
{
    /**
     * Grade user input and generate AI reply in one call.
     *
     * @param  list<string>  $vocabToCheck
     * @return array{feedback: array, reply: string, reply_ipa: string|null, suggested_words: string[]}
     */
    public function gradeAndReply(string $character, string $systemPrompt, string $level, string $history, string $userText, array $vocabToCheck): array;
}
