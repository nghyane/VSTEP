<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface ConversationReviewer
{
    /**
     * Review a completed conversation session.
     *
     * @return array{strengths: string[], improvements: string[], corrected_sentences: array, tip: string}
     */
    public function review(string $title, string $level, string $history, string $userSentences): array;
}
