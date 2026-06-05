<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\WritingContentQualityAnalyzer;
use PHPUnit\Framework\TestCase;

final class WritingContentQualityAnalyzerTest extends TestCase
{
    public function test_flags_clearly_off_topic_response(): void
    {
        $result = (new WritingContentQualityAnalyzer)->analyze(
            text: 'Online learning is popular because students can study at home and watch recorded lessons.',
            prompt: 'Do you think students should wear uniforms at school?',
            requirements: ['state opinion about uniforms', 'give reasons about school uniforms'],
        );

        $this->assertTrue($result['is_irrelevant']);
        $this->assertSame(0, $result['requirements_met_count']);
    }

    public function test_accepts_relevant_opinion_response(): void
    {
        $result = (new WritingContentQualityAnalyzer)->analyze(
            text: 'In my opinion, students should wear uniforms because uniforms reduce pressure and create equality at school.',
            prompt: 'Do you think students should wear uniforms at school?',
            requirements: ['state opinion about uniforms', 'give reasons about school uniforms'],
        );

        $this->assertFalse($result['is_irrelevant']);
        $this->assertSame(2, $result['requirements_met_count']);
    }
}
