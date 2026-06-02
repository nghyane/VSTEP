<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\Linguistics\LinguisticFixtureValidator;
use App\Services\Vocab\CefrVocabularyClassifier;
use Tests\TestCase;

final class LinguisticFixtureTest extends TestCase
{
    public function test_lexical_signal_jsonl_records_are_valid(): void
    {
        $errors = app(LinguisticFixtureValidator::class)->validateLexicalSignals();

        $this->assertSame([], $errors);
    }

    public function test_cefr_vocabulary_jsonl_records_are_valid(): void
    {
        $errors = app(LinguisticFixtureValidator::class)->validateCefrVocabulary();

        $this->assertSame([], $errors);
    }

    public function test_grammar_pattern_jsonl_records_are_valid(): void
    {
        $errors = app(LinguisticFixtureValidator::class)->validateGrammarPatterns();

        $this->assertSame([], $errors);
    }

    public function test_golden_fixture_records_declare_expected_score_source(): void
    {
        $errors = app(LinguisticFixtureValidator::class)->validateGoldenFixtures();

        $this->assertSame([], $errors);
    }

    public function test_cefr_classifier_uses_jsonl_fallback_when_table_is_empty(): void
    {
        $result = app(CefrVocabularyClassifier::class)->analyze('Please accept my sincere apology for my unexpected absence.');

        $this->assertGreaterThan(0, $result['cefr_vocab_count']);
        $this->assertGreaterThan(0, $result['cefr_weighted_avg']);
    }
}
