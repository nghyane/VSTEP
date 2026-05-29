<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\LanguageDetector;
use Tests\TestCase;

final class LanguageDetectorTest extends TestCase
{
    private LanguageDetector $detector;

    protected function setUp(): void
    {
        parent::setUp();
        $this->detector = new LanguageDetector;
    }

    public function test_english_text_is_detected(): void
    {
        $result = $this->detector->detect(
            'Dear Sir, I am writing to apologize for the inconvenience caused.'
        );

        $this->assertTrue($result['is_english']);
        $this->assertGreaterThan(0.9, $result['confidence']);
    }

    public function test_vietnamese_text_is_rejected_by_non_ascii_ratio(): void
    {
        $result = $this->detector->detect(
            'Tôi hy vọng bạn vẫn có một buổi tối tuyệt vời và tận hưởng khoảng thời gian ăn mừng cùng mọi người.'
        );

        $this->assertFalse($result['is_english']);
        $this->assertGreaterThan(0.2, $result['non_ascii_letter_ratio']);
    }

    public function test_short_vietnamese_text_is_rejected(): void
    {
        $result = $this->detector->detect('đây là một câu tiếng Việt ngắn');

        $this->assertFalse($result['is_english']);
    }

    public function test_empty_text_is_english(): void
    {
        $result = $this->detector->detect('');

        $this->assertTrue($result['is_english']);
        $this->assertSame(1.0, $result['confidence']);
    }

    public function test_english_with_vietnamese_names_passes(): void
    {
        // English text with occasional Vietnamese names — ratio should be < 20%
        $result = $this->detector->detect(
            'My friend Nguyễn Văn Anh helped me study for the VSTEP exam.'
        );

        $this->assertTrue($result['is_english']);
        $this->assertLessThan(0.2, $result['non_ascii_letter_ratio']);
    }

    public function test_english_text_with_occasional_accent_passes(): void
    {
        // English text borrowing a word like "café" or "naïve" — rare accents
        $result = $this->detector->detect(
            'I went to the café and ordered a naïve amount of coffee.'
        );

        $this->assertTrue($result['is_english']);
    }

    public function test_english_with_rare_symbols_passes(): void
    {
        // Smart quotes and em dash (rare in English but valid)
        $result = $this->detector->detect(
            "The author\u2014a well-known scholar\u2014said: \u201cKnowledge is power.\u201d"
        );

        $this->assertTrue($result['is_english']);
    }
}
