<?php

declare(strict_types=1);

namespace Tests\Feature\Content;

use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Models\PracticeSpeakingTask;
use App\Models\PracticeWritingPrompt;
use App\Services\Content\ContentReferenceValidator;
use Database\Seeders\ReferencePracticeContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ContentReferenceFixtureTest extends TestCase
{
    use RefreshDatabase;

    public function test_content_reference_fixtures_are_valid(): void
    {
        $errors = app(ContentReferenceValidator::class)->validateAll();

        $this->assertSame([], $errors);
    }

    public function test_reference_practice_content_seeder_imports_curated_bank(): void
    {
        $this->seed(ReferencePracticeContentSeeder::class);

        $this->assertSame(8, PracticeReadingExercise::query()->count());
        $this->assertSame(64, PracticeReadingQuestion::query()->count());
        $this->assertSame(2, PracticeReadingExercise::query()->where('part', 1)->count());
        $this->assertSame(2, PracticeReadingExercise::query()->where('part', 2)->count());
        $this->assertSame(2, PracticeReadingExercise::query()->where('part', 3)->count());
        $this->assertSame(2, PracticeReadingExercise::query()->where('part', 4)->count());
        PracticeReadingExercise::query()
            ->withCount('questions')
            ->get()
            ->each(fn (PracticeReadingExercise $exercise) => $this->assertGreaterThanOrEqual(8, $exercise->questions_count));

        $this->assertSame(8, PracticeListeningExercise::query()->count());
        $this->assertSame(22, PracticeListeningQuestion::query()->count());
        $this->assertSame(4, PracticeListeningExercise::query()->where('part', 1)->count());
        $this->assertSame(2, PracticeListeningExercise::query()->where('part', 2)->count());
        $this->assertSame(2, PracticeListeningExercise::query()->where('part', 3)->count());

        $this->assertSame(20, PracticeWritingPrompt::query()->count());
        $this->assertSame(10, PracticeWritingPrompt::query()->where('part', 1)->count());
        $this->assertSame(10, PracticeWritingPrompt::query()->where('part', 2)->count());

        $this->assertSame(24, PracticeSpeakingTask::query()->count());
        $this->assertSame(8, PracticeSpeakingTask::query()->where('part', 1)->count());
        $this->assertSame(8, PracticeSpeakingTask::query()->where('part', 2)->count());
        $this->assertSame(8, PracticeSpeakingTask::query()->where('part', 3)->count());

        $this->assertDatabaseHas('practice_writing_prompts', [
            'slug' => 'wt2-online-learning-opinion-b2',
            'part' => 2,
            'min_words' => 250,
        ]);
        $this->assertDatabaseHas('practice_speaking_tasks', [
            'slug' => 'sp2-traffic-near-campus-b2',
            'part' => 2,
            'task_type' => 'solution',
        ]);
    }

    public function test_reference_practice_content_reseed_preserves_admin_edits(): void
    {
        $this->seed(ReferencePracticeContentSeeder::class);

        PracticeWritingPrompt::query()
            ->where('slug', 'wt2-online-learning-opinion-b2')
            ->update(['title' => 'Admin edited writing prompt', 'is_published' => false]);
        PracticeSpeakingTask::query()
            ->where('slug', 'sp2-traffic-near-campus-b2')
            ->update(['title' => 'Admin edited speaking task', 'is_published' => false]);
        PracticeReadingExercise::query()
            ->where('slug', 'read-p3-digital-payment-b2')
            ->update(['title' => 'Admin edited reading exercise', 'is_published' => false]);
        PracticeListeningExercise::query()
            ->where('slug', 'listen-p2-job-interview-schedule-b2')
            ->update(['title' => 'Admin edited listening exercise', 'is_published' => false]);

        $this->seed(ReferencePracticeContentSeeder::class);

        $this->assertDatabaseHas('practice_writing_prompts', [
            'slug' => 'wt2-online-learning-opinion-b2',
            'title' => 'Admin edited writing prompt',
            'is_published' => false,
        ]);
        $this->assertDatabaseHas('practice_speaking_tasks', [
            'slug' => 'sp2-traffic-near-campus-b2',
            'title' => 'Admin edited speaking task',
            'is_published' => false,
        ]);
        $this->assertDatabaseHas('practice_reading_exercises', [
            'slug' => 'read-p3-digital-payment-b2',
            'title' => 'Admin edited reading exercise',
            'is_published' => false,
        ]);
        $this->assertDatabaseHas('practice_listening_exercises', [
            'slug' => 'listen-p2-job-interview-schedule-b2',
            'title' => 'Admin edited listening exercise',
            'is_published' => false,
        ]);
    }
}
