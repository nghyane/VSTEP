<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\ConversationReviewer;
use App\Exceptions\AiServiceUnavailableException;
use Illuminate\Support\Facades\Log;

final class LlmConversationReviewer implements ConversationReviewer
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function review(string $title, string $level, string $history, string $userSentences): array
    {
        $prompt = view('ai.conversation.review', [
            'title' => $title,
            'level' => $level,
            'history' => $history,
            'userSentences' => $userSentences,
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'conversation',
            prompt: $prompt,
            toolName: 'conversation_review',
            toolDescription: 'Review a completed conversation session with feedback',
            parametersSchema: [
                'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
                'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
                'corrected_sentences' => ['type' => 'array', 'items' => [
                    'type' => 'object',
                    'properties' => [
                        'original' => ['type' => 'string'],
                        'corrected' => ['type' => 'string'],
                        'explanation' => ['type' => 'string'],
                    ],
                    'required' => ['original', 'corrected', 'explanation'],
                    'additionalProperties' => false,
                ]],
                'tip' => ['type' => 'string'],
            ],
        );

        if (! isset($structured['strengths'])) {
            Log::warning('ConversationReview: could not parse', ['parsed' => $structured]);
            throw new AiServiceUnavailableException;
        }

        return $structured;
    }
}
