<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Production-safe seeder — infrastructure only, no demo accounts.
 * Used by docker-compose deploy to avoid seeding demo users/passwords
 * in production environments.
 */
final class ProductionDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Infrastructure (idempotent)
            SystemConfigSeeder::class,
            WalletSeeder::class,
            GradingRubricSeeder::class,
            CefrVocabularySeeder::class,
            ContentSeeder::class,
            LegacyCurriculumContentSeeder::class,
            VocabCurriculumSeeder::class,
            GrammarCurriculumSeeder::class,
        ]);
    }
}
