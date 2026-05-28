<?php

declare(strict_types=1);

namespace Tests\Unit\Conversation;

use App\Ai\AiClient;
use App\Exceptions\AiServiceUnavailableException;
use App\Services\Ai\LlmConversationReviewer;
use App\Services\Ai\LlmConversationTurnHandler;
use App\Services\Ai\LlmPronunciationAnalyzer;
use Tests\TestCase;

/**
 * AI contract implementations unit tests — injects inline fake AiClient.
 * Tests turn processing, review, and pronunciation flows.
 */
final class SpeakingConversationServiceTest extends TestCase
{
    public function test_generate_ipa_returns_string(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return ['ipa' => 'aɪ piː eɪ'];
            }
        };

        $analyzer = new LlmPronunciationAnalyzer($fakeAi);
        $ipa = $analyzer->generateIpa('IPA');

        $this->assertSame('aɪ piː eɪ', $ipa);
    }

    public function test_pronunciation_review_returns_structured_result(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [
                    'pronunciation' => 'Phát âm tốt các từ chính',
                    'intonation' => 'Ngữ điệu tự nhiên',
                    'tip' => 'Luyện thêm trọng âm từ',
                ];
            }
        };

        $analyzer = new LlmPronunciationAnalyzer($fakeAi);
        $result = $analyzer->analyze('Hello', 'Hallo');

        $this->assertArrayHasKey('pronunciation', $result);
        $this->assertArrayHasKey('intonation', $result);
        $this->assertArrayHasKey('tip', $result);
        $this->assertNotEmpty($result['pronunciation']);
    }

    public function test_pronunciation_review_throws_on_invalid(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [];
            }
        };

        $analyzer = new LlmPronunciationAnalyzer($fakeAi);

        $this->expectException(AiServiceUnavailableException::class);
        $analyzer->analyze('Hello', 'Hallo');
    }

    public function test_turn_processor_returns_valid_structure(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [
                    'feedback' => [
                        'vocab_check' => [['phrase' => 'hello', 'used' => true, 'match_type' => 'exact']],
                        'grammar_ok' => true,
                        'grammar_corrections' => [],
                        'better' => 'Hello there',
                        'user_ipa' => 'hɛˈloʊ',
                        'better_ipa' => 'hɛˈloʊ ðɛr',
                    ],
                    'reply' => 'How are you today?',
                    'reply_ipa' => 'haʊ ɑːr juː təˈdeɪ',
                    'suggested_words' => ['fine', 'good', 'great'],
                ];
            }
        };

        $processor = new LlmConversationTurnHandler($fakeAi);
        $result = $processor->gradeAndReply('Bot', 'Be friendly', 'B1', 'User: Hi', 'Hello', ['hello']);

        $this->assertArrayHasKey('feedback', $result);
        $this->assertArrayHasKey('reply', $result);
        $this->assertStringContainsString('How are you', $result['reply']);
        $this->assertSame(['fine', 'good', 'great'], $result['suggested_words']);
    }

    public function test_reviewer_returns_valid_structure(): void
    {
        $fakeAi = new class implements AiClient
        {
            public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array
            {
                return [
                    'strengths' => ['Good vocabulary usage'],
                    'improvements' => ['Work on grammar'],
                    'corrected_sentences' => [
                        ['original' => 'I go', 'corrected' => 'I went', 'explanation' => 'Past tense needed'],
                    ],
                    'tip' => 'Practice past tense more',
                ];
            }
        };

        $reviewer = new LlmConversationReviewer($fakeAi);
        $result = $reviewer->review('Test', 'A2', 'Bot: Hi', 'I go');

        $this->assertArrayHasKey('strengths', $result);
        $this->assertArrayHasKey('improvements', $result);
        $this->assertArrayHasKey('tip', $result);
    }
}
