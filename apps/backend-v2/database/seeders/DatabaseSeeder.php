<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Infrastructure (idempotent, run once)
            SystemConfigSeeder::class,
            WalletSeeder::class,
            GradingRubricSeeder::class,
            AssessmentRubricSeeder::class,
            LexicalSignalSeeder::class,
            GrammarPatternSeeder::class,
            CefrVocabularySeeder::class,
            ContentSeeder::class,
            LegacyCurriculumContentSeeder::class,
            VocabCurriculumSeeder::class,
            GrammarCurriculumSeeder::class,

            // Demo data (predictable, re-runnable)
            DemoAccountSeeder::class,
            DemoCourseSeeder::class,
            DemoProgressSeeder::class,
            DemoNotificationSeeder::class,
        ]);
    }
}
