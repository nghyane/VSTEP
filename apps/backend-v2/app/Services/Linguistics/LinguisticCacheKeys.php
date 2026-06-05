<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

final class LinguisticCacheKeys
{
    public const CEFR_VOCABULARY_LEVEL_MAP = 'linguistics.cefr_vocabulary.level_map';

    public static function lexicalSignals(string $skill, string $type): string
    {
        return "linguistics.lexical_signals.{$skill}.{$type}";
    }

    public static function grammarPatterns(string $skill): string
    {
        return "linguistics.grammar_patterns.{$skill}";
    }

    /** @return list<string> */
    public static function all(): array
    {
        return [
            self::CEFR_VOCABULARY_LEVEL_MAP,
            self::lexicalSignals('writing', 'linking'),
            self::lexicalSignals('writing', 'collocation'),
            self::lexicalSignals('speaking', 'discourse_marker'),
            self::lexicalSignals('speaking', 'fluency_marker'),
            self::lexicalSignals('speaking', 'interaction_repair'),
            self::lexicalSignals('speaking', 'self_repair'),
            self::lexicalSignals('speaking', 'topic_development'),
            self::lexicalSignals('speaking', 'topic_lexis'),
            self::lexicalSignals('speaking', 'hesitation'),
            self::grammarPatterns('writing'),
        ];
    }
}
