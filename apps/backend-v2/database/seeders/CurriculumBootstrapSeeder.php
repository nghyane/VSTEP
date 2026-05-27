<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GrammarPoint;
use App\Models\VocabTopic;
use Illuminate\Database\Seeder;

final class CurriculumBootstrapSeeder extends Seeder
{
    private const VOCAB_SENTINEL = 'curriculum-gia-dinh-a1';

    private const GRAMMAR_SENTINEL = 'a1-be-subject-pronouns';

    public function run(): void
    {
        $this->call(LegacyCurriculumContentSeeder::class);

        $hasVocabCurriculum = VocabTopic::query()->where('slug', self::VOCAB_SENTINEL)->exists();
        $hasGrammarCurriculum = GrammarPoint::query()->where('slug', self::GRAMMAR_SENTINEL)->exists();

        if ($hasVocabCurriculum && $hasGrammarCurriculum) {
            $this->command?->line('  Curriculum bootstrap skipped - already installed.');

            return;
        }

        if (! $hasVocabCurriculum) {
            $this->call(VocabCurriculumSeeder::class);
        }

        if (! $hasGrammarCurriculum) {
            $this->call(GrammarCurriculumSeeder::class);
        }
    }
}
