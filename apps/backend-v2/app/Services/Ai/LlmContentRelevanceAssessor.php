<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\ContentRelevanceAssessor;

final class LlmContentRelevanceAssessor implements ContentRelevanceAssessor
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function assess(string $transcript, string $prompt, array $requirements): float
    {
        $reqs = array_values(array_filter($requirements, fn ($v) => is_string($v) && $v !== ''));

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: view('ai.conversation.content-relevance', [
                'transcript' => $transcript,
                'prompt' => $prompt,
                'requirements' => $reqs,
            ])->render(),
            toolName: 'check_content_relevance',
            toolDescription: 'Check if speaking transcript addresses the task requirements.',
            parametersSchema: [
                'requirements_met' => ['type' => 'number'],
                'requirements_total' => ['type' => 'number'],
            ],
            instructions: 'You are a VSTEP speaking evaluator. Count how many requirements the transcript addresses. Be objective.',
        );

        $met = max(0, (int) ($structured['requirements_met'] ?? 0));
        $total = max(1, (int) ($structured['requirements_total'] ?? count($reqs)));

        return 0.5 + (min($met, $total) / $total) * 0.5;
    }
}
