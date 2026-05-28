<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed CEFR vocabulary from:
 * 1. Oxford 3000/5000 baseline (~170 words commonly used in VSTEP)
 * 2. vocab_curriculum.php fixture (~200 words organized by topic/level)
 *
 * Deduplicates by word across both sources.
 */
class CefrVocabularySeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('cefr_vocabulary')->count() > 0) {
            return;
        }

        $now = now();
        $seen = [];

        $rows = [];

        // Source 1: Oxford 3000/5000 baseline
        foreach ($this->oxfordWords() as [$word, $level, $pos, $topic]) {
            $seen[strtolower($word)] = true;
            $rows[] = ['word' => $word, 'level' => $level, 'pos' => $pos, 'topic' => $topic, 'source' => 'oxford_3000_5000', 'created_at' => $now, 'updated_at' => $now];
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
    }

    /** @return list<array{string, string, string, string}> */
    private function oxfordWords(): array
    {
        // Function words excluded (a, the, in, on... not useful for vocabulary leveling)
        return [
            // A1 ────────────────────────────────────────────────
            ['good', 'A1', 'adj', 'general'], ['bad', 'A1', 'adj', 'general'],
            ['big', 'A1', 'adj', 'general'], ['small', 'A1', 'adj', 'general'],
            ['new', 'A1', 'adj', 'general'], ['old', 'A1', 'adj', 'general'],
            ['happy', 'A1', 'adj', 'general'], ['sad', 'A1', 'adj', 'general'],
            ['time', 'A1', 'noun', 'general'], ['day', 'A1', 'noun', 'general'],
            ['people', 'A1', 'noun', 'general'], ['thing', 'A1', 'noun', 'general'],
            ['world', 'A1', 'noun', 'general'], ['life', 'A1', 'noun', 'general'],
            ['work', 'A1', 'noun', 'general'], ['money', 'A1', 'noun', 'general'],
            ['friend', 'A1', 'noun', 'general'], ['family', 'A1', 'noun', 'general'],
            ['home', 'A1', 'noun', 'general'], ['school', 'A1', 'noun', 'education'],

            // A2 ────────────────────────────────────────────────
            ['important', 'A2', 'adj', 'general'], ['different', 'A2', 'adj', 'general'],
            ['difficult', 'A2', 'adj', 'general'], ['easy', 'A2', 'adj', 'general'],
            ['popular', 'A2', 'adj', 'general'], ['possible', 'A2', 'adj', 'general'],
            ['useful', 'A2', 'adj', 'general'], ['common', 'A2', 'adj', 'general'],
            ['experience', 'A2', 'noun', 'general'], ['government', 'A2', 'noun', 'government'],
            ['health', 'A2', 'noun', 'health'], ['education', 'A2', 'noun', 'education'],
            ['information', 'A2', 'noun', 'technology'], ['internet', 'A2', 'noun', 'technology'],
            ['knowledge', 'A2', 'noun', 'education'], ['problem', 'A2', 'noun', 'general'],
            ['reason', 'A2', 'noun', 'general'], ['result', 'A2', 'noun', 'general'],
            ['solution', 'A2', 'noun', 'general'], ['opinion', 'A2', 'noun', 'general'],
            ['advantage', 'A2', 'noun', 'general'], ['disadvantage', 'A2', 'noun', 'general'],
            ['opportunity', 'A2', 'noun', 'general'], ['environment', 'A2', 'noun', 'environment'],
            ['however', 'A2', 'adv', 'general'], ['recently', 'A2', 'adv', 'general'],

            // B1 ────────────────────────────────────────────────
            ['significant', 'B1', 'adj', 'general'], ['effective', 'B1', 'adj', 'general'],
            ['responsible', 'B1', 'adj', 'general'], ['modern', 'B1', 'adj', 'general'],
            ['positive', 'B1', 'adj', 'general'], ['beneficial', 'B1', 'adj', 'general'],
            ['serious', 'B1', 'adj', 'general'], ['essential', 'B1', 'adj', 'general'],
            ['flexible', 'B1', 'adj', 'general'], ['independent', 'B1', 'adj', 'general'],
            ['technology', 'B1', 'noun', 'technology'], ['society', 'B1', 'noun', 'general'],
            ['development', 'B1', 'noun', 'general'], ['pollution', 'B1', 'noun', 'environment'],
            ['career', 'B1', 'noun', 'general'], ['skill', 'B1', 'noun', 'general'],
            ['communication', 'B1', 'noun', 'general'], ['culture', 'B1', 'noun', 'general'],
            ['evidence', 'B1', 'noun', 'general'], ['influence', 'B1', 'noun', 'general'],
            ['unemployment', 'B1', 'noun', 'general'], ['issue', 'B1', 'noun', 'general'],
            ['role', 'B1', 'noun', 'general'], ['source', 'B1', 'noun', 'general'],
            ['benefit', 'B1', 'verb', 'general'], ['reduce', 'B1', 'verb', 'general'],
            ['create', 'B1', 'verb', 'general'], ['develop', 'B1', 'verb', 'general'],
            ['affect', 'B1', 'verb', 'general'], ['consider', 'B1', 'verb', 'general'],

            // B2 ────────────────────────────────────────────────
            ['sufficient', 'B2', 'adj', 'general'], ['complex', 'B2', 'adj', 'general'],
            ['diverse', 'B2', 'adj', 'general'], ['potential', 'B2', 'adj', 'general'],
            ['widespread', 'B2', 'adj', 'general'], ['valuable', 'B2', 'adj', 'general'],
            ['crucial', 'B2', 'adj', 'general'], ['dramatic', 'B2', 'adj', 'general'],
            ['efficient', 'B2', 'adj', 'general'], ['comprehensive', 'B2', 'adj', 'general'],
            ['contribute', 'B2', 'verb', 'general'], ['demonstrate', 'B2', 'verb', 'general'],
            ['identify', 'B2', 'verb', 'general'], ['invest', 'B2', 'verb', 'business'],
            ['promote', 'B2', 'verb', 'general'], ['maintain', 'B2', 'verb', 'general'],
            ['consequence', 'B2', 'noun', 'general'], ['impact', 'B2', 'noun', 'general'],
            ['perspective', 'B2', 'noun', 'general'], ['challenge', 'B2', 'noun', 'general'],
            ['policy', 'B2', 'noun', 'government'], ['strategy', 'B2', 'noun', 'general'],
            ['innovation', 'B2', 'noun', 'technology'], ['emission', 'B2', 'noun', 'environment'],
            ['inequality', 'B2', 'noun', 'general'], ['trend', 'B2', 'noun', 'general'],
            ['investment', 'B2', 'noun', 'business'],

            // C1 ────────────────────────────────────────────────
            ['detrimental', 'C1', 'adj', 'general'], ['sustainable', 'C1', 'adj', 'environment'],
            ['inevitable', 'C1', 'adj', 'general'], ['profound', 'C1', 'adj', 'general'],
            ['prevalent', 'C1', 'adj', 'general'], ['viable', 'C1', 'adj', 'general'],
            ['stringent', 'C1', 'adj', 'general'], ['feasible', 'C1', 'adj', 'general'],
            ['indispensable', 'C1', 'adj', 'general'], ['unprecedented', 'C1', 'adj', 'general'],
            ['mitigate', 'C1', 'verb', 'environment'], ['facilitate', 'C1', 'verb', 'general'],
            ['reinforce', 'C1', 'verb', 'general'], ['undermine', 'C1', 'verb', 'general'],
            ['exacerbate', 'C1', 'verb', 'general'], ['alleviate', 'C1', 'verb', 'general'],
            ['infrastructure', 'C1', 'noun', 'general'], ['paradigm', 'C1', 'noun', 'general'],
            ['legislation', 'C1', 'noun', 'government'], ['resilience', 'C1', 'noun', 'general'],
            ['sustainability', 'C1', 'noun', 'environment'], ['acquisition', 'C1', 'noun', 'general'],
            ['disparity', 'C1', 'noun', 'general'], ['urbanization', 'C1', 'noun', 'general'],
            ['bias', 'C1', 'noun', 'general'], ['consensus', 'C1', 'noun', 'general'],
        ];
    }
}
