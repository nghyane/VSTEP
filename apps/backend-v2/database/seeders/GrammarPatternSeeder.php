<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GrammarPattern;
use App\Services\Linguistics\JsonlFixtureReader;
use App\Services\Linguistics\LinguisticCacheKeys;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

final class GrammarPatternSeeder extends Seeder
{
    private const FIXTURE = 'reference/linguistics/bootstrap/grammar-patterns.jsonl';

    public function run(): void
    {
        if (! Schema::hasTable('grammar_patterns')) {
            return;
        }

        foreach (app(JsonlFixtureReader::class)->read(self::FIXTURE) as $pattern) {
            GrammarPattern::query()->updateOrCreate(
                ['key' => $pattern['key']],
                [
                    'label' => $pattern['label'],
                    'level' => $pattern['level'],
                    'category' => $pattern['category'],
                    'pattern_type' => $pattern['pattern_type'],
                    'pattern' => $pattern['pattern'],
                    'skill' => $pattern['skill'],
                    'weight' => $pattern['weight'],
                    'source' => $pattern['source'],
                    'is_active' => $pattern['is_active'],
                ],
            );
        }

        Cache::forget(LinguisticCacheKeys::grammarPatterns('writing'));
    }
}
