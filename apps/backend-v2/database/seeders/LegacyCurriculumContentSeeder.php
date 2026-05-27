<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GrammarPoint;
use App\Models\VocabTopic;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class LegacyCurriculumContentSeeder extends Seeder
{
    private const VOCAB_SLUGS = [
        'family-life',
        'ipsam-numquam-aQjt',
        'education-learning',
        'environment-nature',
        'health-medicine',
        'technology-innovation',
        'work-career',
        'society-community',
        'travel-tourism',
        'economy-business',
        'culture-arts',
        'urban-rural-life',
    ];

    private const GRAMMAR_SLUGS = [
        'present-perfect',
        'passive-voice',
        'conditional-sentences',
        'relative-clauses',
        'modal-verbs',
        'reported-speech',
        'articles',
        'gerunds-infinitives',
        'comparison',
        'conjunctions-linking',
    ];

    public function run(): void
    {
        DB::transaction(function (): void {
            VocabTopic::query()
                ->whereIn('slug', self::VOCAB_SLUGS)
                ->update(['is_published' => false]);

            GrammarPoint::query()
                ->whereIn('slug', self::GRAMMAR_SLUGS)
                ->update(['is_published' => false]);
        });

        $this->command?->info('Retired legacy vocabulary and grammar fixture cards from learner-facing content.');
    }
}
