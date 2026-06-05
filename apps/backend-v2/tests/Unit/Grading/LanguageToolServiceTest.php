<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\LanguageToolService;
use ReflectionMethod;
use Tests\TestCase;

final class LanguageToolServiceTest extends TestCase
{
    public function test_speaking_transcript_filter_keeps_grammar_and_typos_only(): void
    {
        $this->assertTrue($this->isSpeakingGrammarSignal('Grammar'));
        $this->assertTrue($this->isSpeakingGrammarSignal('Typos'));
        $this->assertTrue($this->isSpeakingGrammarSignal('Confused Words'));
        $this->assertFalse($this->isSpeakingGrammarSignal('Punctuation'));
        $this->assertFalse($this->isSpeakingGrammarSignal('Style'));
    }

    private function isSpeakingGrammarSignal(string $category): bool
    {
        $method = new ReflectionMethod(LanguageToolService::class, 'isSpeakingGrammarSignal');
        $method->setAccessible(true);

        return $method->invoke(app(LanguageToolService::class), $category);
    }
}
