<?php

declare(strict_types=1);

namespace Tests\Feature\Content;

use App\Models\GrammarPoint;
use App\Models\VocabTopic;
use Database\Seeders\ContentSeeder;
use Database\Seeders\CurriculumBootstrapSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\GrammarCurriculumSeeder;
use Database\Seeders\VocabCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class CurriculumBootstrapSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_bootstrap_retires_legacy_cards_and_installs_curriculum(): void
    {
        $this->seed(ContentSeeder::class);
        $this->seed(CurriculumBootstrapSeeder::class);

        $this->assertDatabaseHas('vocab_topics', ['slug' => 'education-learning', 'is_published' => false]);
        $this->assertDatabaseHas('grammar_points', ['slug' => 'present-perfect', 'is_published' => false]);
        $this->assertSame(30, VocabTopic::query()->where('is_published', true)->count());
        $this->assertSame(30, GrammarPoint::query()->where('is_published', true)->count());
    }

    public function test_restart_bootstrap_does_not_overwrite_curriculum_admin_edits(): void
    {
        $this->seed(ContentSeeder::class);
        $this->seed(CurriculumBootstrapSeeder::class);

        VocabTopic::query()
            ->where('slug', 'curriculum-gia-dinh-a1')
            ->update(['name' => 'Admin edited topic', 'is_published' => false]);
        GrammarPoint::query()
            ->where('slug', 'a1-be-subject-pronouns')
            ->update(['name' => 'Admin edited point', 'is_published' => false]);

        $this->seed(CurriculumBootstrapSeeder::class);

        $this->assertDatabaseHas('vocab_topics', ['slug' => 'curriculum-gia-dinh-a1', 'name' => 'Admin edited topic', 'is_published' => false]);
        $this->assertDatabaseHas('grammar_points', ['slug' => 'a1-be-subject-pronouns', 'name' => 'Admin edited point', 'is_published' => false]);
    }

    public function test_upgrade_bootstrap_retires_legacy_cards_when_curriculum_already_exists(): void
    {
        $this->seed(ContentSeeder::class);
        $this->seed(VocabCurriculumSeeder::class);
        $this->seed(GrammarCurriculumSeeder::class);

        $this->assertDatabaseHas('vocab_topics', ['slug' => 'education-learning', 'is_published' => true]);
        $this->seed(CurriculumBootstrapSeeder::class);

        $this->assertDatabaseHas('vocab_topics', ['slug' => 'education-learning', 'is_published' => false]);
        $this->assertDatabaseHas('grammar_points', ['slug' => 'present-perfect', 'is_published' => false]);
    }

    public function test_database_seeder_publishes_only_current_curriculum_cards(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(30, VocabTopic::query()->where('is_published', true)->count());
        $this->assertSame(30, GrammarPoint::query()->where('is_published', true)->count());
    }
}
