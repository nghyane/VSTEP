<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Linguistics\JsonlFixtureReader;
use App\Services\Linguistics\LinguisticCacheKeys;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CefrVocabularySeeder extends Seeder
{
    private const FIXTURE = 'reference/linguistics/bootstrap/cefr-vocabulary.jsonl';

    public function run(): void
    {
        if (DB::table('cefr_vocabulary')->count() > 0) {
            Cache::forget(LinguisticCacheKeys::CEFR_VOCABULARY_LEVEL_MAP);

            return;
        }

        $now = now();
        $seen = [];

        $rows = [];

        // Source 1: JSONL reference baseline
        foreach (app(JsonlFixtureReader::class)->read(self::FIXTURE) as $entry) {
            $word = strtolower((string) ($entry['word'] ?? ''));
            if ($word === '' || isset($seen[$word])) {
                continue;
            }

            $seen[$word] = true;
            $rows[] = [
                'word' => $word,
                'level' => (string) ($entry['level'] ?? ''),
                'pos' => (string) ($entry['pos'] ?? ''),
                'topic' => (string) ($entry['topic'] ?? ''),
                'source' => (string) ($entry['source'] ?? 'cefr_vocabulary_jsonl'),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Source 2: vocab_curriculum.php fixture
        $curriculum = require database_path('fixtures/vocab_curriculum.php');
        foreach ($curriculum as $topicName => $levels) {
            foreach ($levels as $level => $words) {
                foreach ($words as $entry) {
                    $word = strtolower((string) ($entry[0] ?? ''));
                    if ($word === '' || isset($seen[$word])) {
                        continue;
                    }
                    $seen[$word] = true;
                    $pos = (string) ($entry[1] ?? '');
                    $rows[] = ['word' => $word, 'level' => $level, 'pos' => $pos, 'topic' => $topicName, 'source' => 'vocab_curriculum', 'created_at' => $now, 'updated_at' => $now];
                }
            }
        }

        // Source 3: Oxford supplement (collocations, phrasal verbs, academic)
        $supplement = require database_path('fixtures/vocab_curriculum_supplement.php');
        if (is_array($supplement)) {
            foreach ($supplement as $topicName => $levels) {
                foreach ($levels as $level => $words) {
                    foreach ($words as $entry) {
                        $word = strtolower((string) ($entry[0] ?? ''));
                        if ($word === '' || isset($seen[$word])) {
                            continue;
                        }
                        $seen[$word] = true;
                        $pos = (string) ($entry[1] ?? '');
                        $rows[] = ['word' => $word, 'level' => $level, 'pos' => $pos, 'topic' => $topicName, 'source' => 'vocab_supplement', 'created_at' => $now, 'updated_at' => $now];
                    }
                }
            }
        }

        DB::table('cefr_vocabulary')->insert($rows);

        $byLevel = DB::table('cefr_vocabulary')
            ->select('level', DB::raw('count(*) as cnt'))
            ->groupBy('level')->orderBy('level')->get();

        $this->command?->info('CEFR Vocabulary seeded: '.count($rows).' words');
        foreach ($byLevel as $row) {
            $this->command?->line("  {$row->level}: {$row->cnt} words");
        }

        Cache::forget(LinguisticCacheKeys::CEFR_VOCABULARY_LEVEL_MAP);
    }
}
