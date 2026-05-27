<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\AiClient;

/**
 * Fake AiClient for testing — returns deterministic responses
 * without making any HTTP calls.
 */
final class FakeAiClient implements AiClient
{
    public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
    {
        if (str_starts_with($toolName, 'extract')) {
            return $this->fakeEvidenceResponse();
        }
        if ($toolName === 'generate_ipa') {
            return ['ipa' => 'hɛˈloʊ wɜːrld'];
        }

        return match ($service) {
            'grading' => $this->fakeGradingResponse(),
            'conversation' => $this->fakeConversationResponse($prompt),
            'pronunciation' => $this->fakePronunciationResponse(),
            default => [],
        };
    }

    private function fakeGradingResponse(): array
    {
        return [
            'rubric_scores' => [
                'task_fulfillment' => 7.5,
                'organization' => 6.0,
                'vocabulary' => 6.0,
                'grammar' => 7.5,
            ],
            'overall_band' => 7.0,
            'strengths' => ['Bố cục bài viết rõ ràng'],
            'improvements' => [['message' => 'Sử dụng thêm từ nối', 'explanation' => 'Dùng however, moreover để liên kết ý']],
            'rewrites' => [],
            'annotations' => [],
        ];
    }

    private function fakeEvidenceResponse(): array
    {
        return [
            'requirements_met' => 3,
            'requirements_total' => 3,
            'has_clear_position' => true,
            'has_irrelevant_content' => false,
            'strengths' => ['Bố cục rõ ràng'],
            'improvements' => ['Dùng thêm từ nối'],
            'rewrites' => [],
        ];
    }

    private function fakeConversationResponse(string $prompt): array
    {
        // Detect if this is a turn or review prompt
        if (str_contains($prompt, 'User just said')) {
            return [
                'feedback' => [
                    'word_count' => ['used' => 1, 'target' => 2],
                    'grammar_ok' => true,
                    'grammar_corrections' => [],
                    'vocab_check' => [],
                    'better' => 'Hello, how are you?',
                    'user_ipa' => 'hɛˈloʊ',
                    'better_ipa' => 'hɛˈloʊ, haʊ ɑːr juː',
                ],
                'reply' => "I'm doing great, thank you! How about you?",
                'reply_ipa' => 'aɪm ˈduɪŋ ɡreɪt, θæŋk juː',
                'suggested_words' => ['I am fine', 'Not bad'],
            ];
        }

        return [
            'strengths' => ['Good vocabulary usage'],
            'improvements' => ['Work on pronunciation'],
            'corrected_sentences' => [],
            'tip' => 'Keep practicing!',
        ];
    }

    private function fakePronunciationResponse(): array
    {
        return [
            'pronunciation' => 'Phát âm tốt',
            'intonation' => 'Ngữ điệu ổn',
            'tip' => 'Tiếp tục luyện tập',
        ];
    }
}
