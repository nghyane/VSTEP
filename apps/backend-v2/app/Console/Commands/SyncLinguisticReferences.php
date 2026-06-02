<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Linguistics\LinguisticCacheKeys;
use App\Services\Linguistics\LinguisticFixtureValidator;
use App\Services\Linguistics\OpenLanguageProfilesImporter;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SyncLinguisticReferences extends Command
{
    protected $signature = 'linguistics:sync
        {--no-validate : Skip fixture validation}
        {--status : Only print current reference data status}';

    protected $description = 'Validate, import, seed, warm and report linguistic reference data in one command';

    public function handle(LinguisticFixtureValidator $validator, OpenLanguageProfilesImporter $importer): int
    {
        if ((bool) $this->option('status')) {
            $this->printStatus();

            return self::SUCCESS;
        }

        if (! (bool) $this->option('no-validate')) {
            $errors = [
                ...$validator->validateLexicalSignals(),
                ...$validator->validateCefrVocabulary(),
                ...$validator->validateGrammarPatterns(),
            ];

            if ($errors !== []) {
                foreach ($errors as $error) {
                    $this->error($error);
                }

                return self::FAILURE;
            }

            $this->info('Fixtures valid.');
        }

        Artisan::call('db:seed', ['--class' => 'LexicalSignalSeeder', '--force' => true]);
        Artisan::call('db:seed', ['--class' => 'GrammarPatternSeeder', '--force' => true]);
        Artisan::call('db:seed', ['--class' => 'CefrVocabularySeeder', '--force' => true]);

        $result = $importer->import($this->output);
        $this->info("Open Language Profiles vocabulary rows processed: {$result['vocabulary']}");
        $this->info("Open Language Profiles grammar rows processed: {$result['grammar_patterns']}");

        $this->warmCache();
        $this->printStatus();

        return self::SUCCESS;
    }

    private function warmCache(): void
    {
        Cache::forget(LinguisticCacheKeys::CEFR_VOCABULARY_LEVEL_MAP);
        Cache::forget(LinguisticCacheKeys::lexicalSignals('writing', 'linking'));
        Cache::forget(LinguisticCacheKeys::lexicalSignals('writing', 'collocation'));
        foreach (['discourse_marker', 'fluency_marker', 'interaction_repair', 'self_repair', 'topic_development', 'topic_lexis', 'hesitation'] as $type) {
            Cache::forget(LinguisticCacheKeys::lexicalSignals('speaking', $type));
        }
        Cache::forget(LinguisticCacheKeys::grammarPatterns('writing'));

        app(CefrVocabularyClassifier::class)->analyze('sincere apology circumstance sustainability');

        $this->info('Reference cache warmed.');
    }

    private function printStatus(): void
    {
        $this->info('Linguistic reference status');
        $this->line('  lexical_signals: '.($this->tableCount('lexical_signals') ?? 'not migrated'));
        $this->line('  cefr_vocabulary: '.($this->tableCount('cefr_vocabulary') ?? 'not migrated'));
        $this->line('  grammar_patterns: '.($this->tableCount('grammar_patterns') ?? 'not migrated'));

        if (Schema::hasTable('cefr_vocabulary')) {
            DB::table('cefr_vocabulary')
                ->select('level', DB::raw('count(*) as cnt'))
                ->groupBy('level')
                ->orderBy('level')
                ->get()
                ->each(fn (object $row) => $this->line("    {$row->level}: {$row->cnt}"));
        }
    }

    private function tableCount(string $table): ?int
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        return DB::table($table)->count();
    }
}
