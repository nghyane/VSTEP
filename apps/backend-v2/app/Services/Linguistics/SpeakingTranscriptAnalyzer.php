<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use App\Models\LexicalSignal;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

final class SpeakingTranscriptAnalyzer
{
    private const FIXTURE = 'reference/linguistics/bootstrap/lexical-signals.jsonl';

    private const TYPES = [
        'discourse_marker',
        'fluency_marker',
        'interaction_repair',
        'self_repair',
        'topic_development',
        'topic_lexis',
        'hesitation',
    ];

    /** @return array<string,mixed> */
    public function analyze(string $transcript): array
    {
        $text = Str::lower($transcript);
        $matches = [];
        $counts = array_fill_keys(self::TYPES, 0);

        foreach (self::TYPES as $type) {
            foreach ($this->signals($type) as $signal) {
                $count = $this->countPhraseOccurrences($text, $signal['phrase']);
                if ($count === 0) {
                    continue;
                }

                $counts[$type] += $count * $signal['weight'];
                $matches[] = [
                    'phrase' => $signal['phrase'],
                    'type' => $signal['type'],
                    'category' => $signal['category'],
                    'level' => $signal['level'],
                    'count' => $count,
                    'weight' => $signal['weight'],
                    'source' => $signal['source'],
                ];
            }
        }

        return [
            ...$counts,
            'matches' => $matches,
        ];
    }

    /** @return list<array{phrase:string,type:string,category:string,level:string|null,weight:int,source:string}> */
    private function signals(string $type): array
    {
        static $cache = [];
        if (isset($cache[$type])) {
            return $cache[$type];
        }

        if (! Schema::hasTable('lexical_signals')) {
            return $cache[$type] = $this->fixtureSignals($type);
        }

        $signals = Cache::rememberForever(
            LinguisticCacheKeys::lexicalSignals('speaking', $type),
            fn (): array => LexicalSignal::query()
                ->active()
                ->where('skill', 'speaking')
                ->where('type', $type)
                ->get(['phrase', 'type', 'category', 'level', 'weight', 'source'])
                ->map(fn (LexicalSignal $signal): array => [
                    'phrase' => Str::lower($signal->phrase),
                    'type' => $signal->type,
                    'category' => $signal->category,
                    'level' => $signal->level,
                    'weight' => $signal->weight,
                    'source' => $signal->source,
                ])
                ->values()
                ->all(),
        );

        return $cache[$type] = $signals !== [] ? $signals : $this->fixtureSignals($type);
    }

    /** @return list<array{phrase:string,type:string,category:string,level:string|null,weight:int,source:string}> */
    private function fixtureSignals(string $type): array
    {
        $signals = [];
        foreach (app(JsonlFixtureReader::class)->read(self::FIXTURE) as $row) {
            if (($row['skill'] ?? null) !== 'speaking' || ($row['type'] ?? null) !== $type) {
                continue;
            }

            $signals[] = [
                'phrase' => Str::lower((string) $row['phrase']),
                'type' => (string) $row['type'],
                'category' => (string) $row['category'],
                'level' => isset($row['level']) ? (string) $row['level'] : null,
                'weight' => (int) ($row['weight'] ?? 1),
                'source' => (string) $row['source'],
            ];
        }

        return $signals;
    }

    private function countPhraseOccurrences(string $text, string $phrase): int
    {
        $pattern = '/(?<![a-z])'.preg_quote($phrase, '/').'(?![a-z])/u';

        return preg_match_all($pattern, $text) ?: 0;
    }
}
