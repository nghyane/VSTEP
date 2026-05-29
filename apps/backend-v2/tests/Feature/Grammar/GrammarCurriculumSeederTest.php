<?php

declare(strict_types=1);

namespace Tests\Feature\Grammar;

use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarPointLevel;
use Database\Seeders\GrammarCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class GrammarCurriculumSeederTest extends TestCase
{
    use RefreshDatabase;

    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

    public function test_curriculum_has_complete_level_and_content_coverage(): void
    {
        $this->seed(GrammarCurriculumSeeder::class);

        $points = GrammarPoint::query()
            ->where('is_published', true)
            ->with([
                'levels', 'tasks', 'functions', 'structures', 'examples', 'commonMistakes', 'vstepTips',
                'exercises' => fn ($query) => $query->where('is_active', true),
            ])
            ->get();

        $this->assertGreaterThan(0, $points->count(), 'Curriculum should have grammar points');

        $lessons = $points->where('is_checkpoint', false);
        $checkpoints = $points->where('is_checkpoint', true);

        // One checkpoint per level
        $this->assertCount(count(self::LEVELS), $checkpoints);

        foreach (self::LEVELS as $level) {
            $levelLessons = $lessons->filter(fn (GrammarPoint $point) => $point->levels->pluck('level')->contains($level));
            $this->assertGreaterThan(0, $levelLessons->count(), "Level {$level} should have lessons");
            $this->assertCount(1, $checkpoints->filter(fn (GrammarPoint $point) => $point->levels->pluck('level')->contains($level)), "Level {$level} should have 1 checkpoint");
        }

        foreach ($lessons as $point) {
            $this->assertCount(1, $point->levels);
            $this->assertCount(1, $point->tasks);
            $this->assertCount(1, $point->functions);
            $this->assertGreaterThanOrEqual(2, $point->structures->count());
            $this->assertGreaterThanOrEqual(3, $point->examples->count());
            $this->assertGreaterThanOrEqual(2, $point->commonMistakes->count());
            $this->assertGreaterThanOrEqual(1, $point->vstepTips->count());
            $this->assertSame(3, $point->examples->pluck('en')->unique()->count());
            $this->assertSame(2, $point->commonMistakes->pluck('wrong')->unique()->count());
            $this->assertNotSame(
                'Dùng cấu trúc này khi nó làm ý rõ hơn; ưu tiên chính xác trước độ phức tạp.',
                $point->vstepTips->first()->tip,
            );
            $this->assertNotNull($point->learning_objective);
            $this->assertNotNull($point->success_criteria);
            $this->assertNotNull($point->cefr_descriptor);
            $this->assertNotNull($point->vstep_use_case);
            $this->assertEqualsCanonicalizing(['guided-practice', "{$point->levels->first()->level}-checkpoint"], $point->assessed_by);
            $this->assertGreaterThan(0, $point->exercises->count(), 'Each lesson should have exercises');
            $this->assertSame(['mcq'], $point->exercises->pluck('kind')->unique()->values()->all());
            $this->assertGreaterThan(0, $point->exercises->pluck('payload.prompt')->unique()->count(), 'Should have unique prompts');
        }

        foreach ($checkpoints as $checkpoint) {
            $this->assertGreaterThan(0, count($checkpoint->prerequisite_slugs), 'Checkpoints should have prerequisites');
            $this->assertSame(['level-checkpoint'], $checkpoint->assessed_by);
            $this->assertGreaterThan(0, $checkpoint->exercises->count(), 'Checkpoints should have exercises');
            $this->assertSame(['mcq'], $checkpoint->exercises->pluck('kind')->unique()->values()->all());
        }
    }

    public function test_reseeding_preserves_admin_points_without_duplication(): void
    {
        GrammarPoint::factory()->create(['slug' => 'admin-created-point', 'is_published' => true]);

        $this->seed(GrammarCurriculumSeeder::class);
        $totalAfterFirstSeed = GrammarPoint::query()->where('is_published', true)->count();

        $curriculumPoint = GrammarPoint::query()->where('slug', 'a1-be-subject-pronouns')->firstOrFail();
        GrammarPointLevel::query()->create(['grammar_point_id' => $curriculumPoint->id, 'level' => 'C1']);

        $this->seed(GrammarCurriculumSeeder::class);

        $this->assertDatabaseHas('grammar_points', ['slug' => 'admin-created-point', 'is_published' => true]);
        $this->assertSame($totalAfterFirstSeed, GrammarPoint::query()->where('is_published', true)->count(), 'Re-seed should not create duplicates');
        $this->assertSame(1, $curriculumPoint->fresh()->levels()->count(), 'Curriculum seeder should reset level count');

        $activeExercises = GrammarExercise::query()->where('is_active', true)->count();
        $this->assertGreaterThan(0, $activeExercises, 'Should have active exercises');
    }
}
