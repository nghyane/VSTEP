<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\LexicalSignal;
use App\Services\Linguistics\JsonlFixtureReader;
use App\Services\Linguistics\LinguisticCacheKeys;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

final class LexicalSignalSeeder extends Seeder
{
    private const FIXTURE = 'reference/linguistics/bootstrap/lexical-signals.jsonl';

    public function run(): void
    {
        if (! Schema::hasTable('lexical_signals')) {
            return;
        }

        foreach ($this->signals() as $signal) {
            LexicalSignal::query()->updateOrCreate(
                [
                    'phrase' => $signal['phrase'],
                    'type' => $signal['type'],
                    'skill' => $signal['skill'],
                    'task_type' => $signal['task_type'],
                ],
                $signal,
            );
        }

        Cache::forget(LinguisticCacheKeys::lexicalSignals('writing', 'linking'));
        Cache::forget(LinguisticCacheKeys::lexicalSignals('writing', 'collocation'));
        foreach (['discourse_marker', 'fluency_marker', 'interaction_repair', 'self_repair', 'topic_development', 'topic_lexis', 'hesitation'] as $type) {
            Cache::forget(LinguisticCacheKeys::lexicalSignals('speaking', $type));
        }
    }

    /** @return list<array<string, mixed>> */
    public static function fixtureSignals(): array
    {
        return app(JsonlFixtureReader::class)->read(self::FIXTURE);
    }

    /** @return list<array<string, mixed>> */
    private function signals(): array
    {
        return array_map(fn (array $signal): array => [
            'skill' => 'writing',
            'task_type' => null,
            'weight' => 1,
            'is_active' => true,
            ...$signal,
        ], self::fixtureSignals());
    }
}
