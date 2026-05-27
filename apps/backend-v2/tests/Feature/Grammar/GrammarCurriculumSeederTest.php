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

        $this->assertCount(35, $points);
        $lessons = $points->where('is_checkpoint', false);
        $checkpoints = $points->where('is_checkpoint', true);
        $this->assertCount(30, $lessons);
        $this->assertCount(5, $checkpoints);

        foreach (self::LEVELS as $level) {
            $this->assertCount(6, $lessons->filter(fn (GrammarPoint $point) => $point->levels->pluck('level')->contains($level)));
            $this->assertCount(1, $checkpoints->filter(fn (GrammarPoint $point) => $point->levels->pluck('level')->contains($level)));
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
            $this->assertCount(2, $point->exercises);
            $this->assertSame(['mcq', 'mcq'], $point->exercises->pluck('kind')->all());
            $this->assertCount(2, $point->exercises->pluck('payload.prompt')->unique());
        }

        foreach ($checkpoints as $checkpoint) {
            $this->assertCount(6, $checkpoint->prerequisite_slugs);
            $this->assertSame(['level-checkpoint'], $checkpoint->assessed_by);
            $this->assertCount(6, $checkpoint->exercises);
            $this->assertSame(['mcq'], $checkpoint->exercises->pluck('kind')->unique()->values()->all());
        }
    }

    public function test_reseeding_preserves_admin_points_without_duplication(): void
    {
        GrammarPoint::factory()->create(['slug' => 'admin-created-point', 'is_published' => true]);

        $this->seed(GrammarCurriculumSeeder::class);
        $curriculumPoint = GrammarPoint::query()->where('slug', 'a1-be-subject-pronouns')->firstOrFail();
        GrammarPointLevel::query()->create(['grammar_point_id' => $curriculumPoint->id, 'level' => 'C1']);

        $this->seed(GrammarCurriculumSeeder::class);

        $this->assertDatabaseHas('grammar_points', ['slug' => 'admin-created-point', 'is_published' => true]);
        $this->assertSame(36, GrammarPoint::query()->where('is_published', true)->count());
        $this->assertSame(1, $curriculumPoint->fresh()->levels()->count());
        $this->assertSame(90, GrammarExercise::query()->where('is_active', true)->count());
    }
}
