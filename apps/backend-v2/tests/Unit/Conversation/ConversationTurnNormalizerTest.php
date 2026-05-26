<?php

declare(strict_types=1);

namespace Tests\Unit\Conversation;

use App\Services\ConversationTurnNormalizer;
use Tests\TestCase;

/**
 * ConversationTurnNormalizer has no dependencies — pure data transformation.
 */
final class ConversationTurnNormalizerTest extends TestCase
{
    private ConversationTurnNormalizer $normalizer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->normalizer = new ConversationTurnNormalizer;
    }

    public function test_normalize_vocab_check_merges_with_target(): void
    {
        $data = [
            'feedback' => [
                'vocab_check' => [
                    ['phrase' => 'hello', 'used' => true],
                    ['phrase' => 'goodbye', 'used' => false],
                ],
                'grammar_ok' => true,
                'grammar_corrections' => [],
                'better' => 'Hello world',
                'user_ipa' => 'hɛˈloʊ wɜːrld',
                'better_ipa' => 'hɛˈloʊ wɜːrld',
            ],
            'reply' => 'Hi there!',
            'reply_ipa' => 'haɪ ðɛr',
            'suggested_words' => ['nice', 'cool'],
        ];

        $targetVocab = ['hello', 'goodbye', 'thanks'];
        $result = $this->normalizer->normalize($data, $targetVocab, 'hello goodbye', 'Hello goodbye');

        $this->assertNotNull($result);
        // LLM says hello=true, goodbye=false → normalizer respects LLM decisions.
        // 'thanks' was not in LLM vocab_check → falls back to Str::contains detection.
        $this->assertSame(1, $result['feedback']['word_count']['used']);
        $this->assertSame(3, $result['feedback']['word_count']['target']);
        $this->assertTrue($result['feedback']['grammar_ok']);
        $this->assertSame('Hi there!', $result['reply']);
        $this->assertSame(['nice', 'cool'], $result['suggested_words']);
    }

    public function test_normalize_adds_missing_vocab_entries(): void
    {
        $data = [
            'feedback' => [
                'vocab_check' => [],
                'grammar_ok' => true,
                'grammar_corrections' => [],
                'better' => 'Test',
                'user_ipa' => null,
                'better_ipa' => null,
            ],
            'reply' => 'Ok',
            'reply_ipa' => null,
            'suggested_words' => [],
        ];

        $targetVocab = ['hello'];
        $result = $this->normalizer->normalize($data, $targetVocab, 'hello world', 'Hello world');

        $this->assertNotNull($result);
        $this->assertCount(1, $result['feedback']['vocab_check']);
        $this->assertTrue($result['feedback']['vocab_check'][0]['used']);
    }

    public function test_normalize_empty_better_returns_original(): void
    {
        $data = [
            'feedback' => [
                'vocab_check' => [],
                'grammar_ok' => false,
                'grammar_corrections' => [
                    ['wrong' => 'he go', 'correct' => 'he goes', 'explanation' => 'Subject-verb agreement'],
                ],
                'better' => '',
                'user_ipa' => null,
                'better_ipa' => null,
            ],
            'reply' => 'Yes',
            'reply_ipa' => null,
            'suggested_words' => [],
        ];

        $result = $this->normalizer->normalize($data, [], 'he go', 'he go');

        $this->assertNotNull($result);
        $this->assertSame('he go', $result['feedback']['better']);
        $this->assertCount(1, $result['feedback']['grammar_corrections']);
        $this->assertFalse($result['feedback']['grammar_ok']);
    }

    public function test_normalize_null_input_returns_null(): void
    {
        $result = $this->normalizer->normalize(null, [], '', '');

        $this->assertNull($result);
    }

    public function test_normalize_missing_feedback_returns_null(): void
    {
        $result = $this->normalizer->normalize(['reply' => 'hi'], [], '', '');

        $this->assertNull($result);
    }

    public function test_normalize_pre_check_vocab_match(): void
    {
        // VocabCheck passed to prompt has pre_match=true if text contains phrase
        // Normalizer should pick up the phrase even if LLM missed it
        $data = [
            'feedback' => [
                'vocab_check' => [['phrase' => 'thank you', 'used' => false]],
                'grammar_ok' => true,
                'grammar_corrections' => [],
                'better' => 'Thank you',
                'user_ipa' => null,
                'better_ipa' => null,
            ],
            'reply' => 'You are welcome',
            'reply_ipa' => null,
            'suggested_words' => [],
        ];

        $targetVocab = ['thank you'];
        $result = $this->normalizer->normalize($data, $targetVocab, 'thank you very much', 'Thank you very much');

        $this->assertNotNull($result);
        // LLM explicitly returned used=false — normalizer does NOT override LLM decision.
        // Str::contains fallback only runs when the LLM didn't mention the phrase at all.
        $this->assertFalse($result['feedback']['vocab_check'][0]['used']);
    }

    public function test_normalize_defaults_grammar_ok_to_true(): void
    {
        $data = [
            'feedback' => [
                'vocab_check' => [],
                'grammar_corrections' => [],
                'better' => 'Test',
                'user_ipa' => null,
                'better_ipa' => null,
            ],
            'reply' => 'Ok',
            'reply_ipa' => null,
            'suggested_words' => [],
        ];

        $result = $this->normalizer->normalize($data, [], '', 'Test');

        $this->assertNotNull($result);
        $this->assertTrue($result['feedback']['grammar_ok']);
    }
}
