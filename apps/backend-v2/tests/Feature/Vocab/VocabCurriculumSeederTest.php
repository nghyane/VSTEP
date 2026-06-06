<?php

declare(strict_types=1);

namespace Tests\Feature\Vocab;

use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use Database\Seeders\VocabCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

final class VocabCurriculumSeederTest extends TestCase
{
    use RefreshDatabase;

    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

    private const TOPICS = ['Gia đình', 'Giáo dục', 'Sức khỏe', 'Môi trường', 'Công việc', 'Công nghệ'];

    public function test_curriculum_covers_each_topic_from_a1_to_c1_with_examples(): void
    {
        $this->seed(VocabCurriculumSeeder::class);

        $topics = VocabTopic::query()
            ->where('is_published', true)
            ->with('words')
            ->get();

        $this->assertCount(30, $topics);
        $this->assertSame(600, VocabWord::query()->count());
        $this->assertSame(60, VocabExercise::query()->count());

        foreach (self::TOPICS as $name) {
            $topicLevels = $topics->where('name', $name)->pluck('level')->sort()->values()->all();
            $expectedLevels = collect(self::LEVELS)->sort()->values()->all();

            $this->assertSame($expectedLevels, $topicLevels, "{$name} phải có đủ cấp độ A1-C1.");
        }

        foreach ($topics as $topic) {
            $this->assertCount(20, $topic->words, "{$topic->name} {$topic->level} phải có 20 từ.");
            $this->assertSame(2, $topic->exercises()->count(), "{$topic->name} {$topic->level} phải có 2 bài tập từ vựng.");
            foreach ($topic->words as $word) {
                $this->assertNotEmpty($word->definition);
                $this->assertNotEmpty($word->example);
                $this->assertNull($word->vstep_tip);
                $this->assertTrue(
                    Str::contains(Str::lower($word->example), Str::lower($word->word)),
                    "Câu ví dụ phải chứa từ mục tiêu: {$word->word}.",
                );
            }
        }
    }

    public function test_reseeding_preserves_admin_topics_without_duplicating_curriculum(): void
    {
        VocabTopic::factory()->create(['slug' => 'admin-created-topic', 'name' => 'Admin Topic', 'is_published' => true]);

        $this->seed(VocabCurriculumSeeder::class);
        $this->seed(VocabCurriculumSeeder::class);

        $this->assertDatabaseHas('vocab_topics', [
            'slug' => 'admin-created-topic',
            'is_published' => true,
        ]);
        $this->assertSame(31, VocabTopic::query()->where('is_published', true)->count());
        $this->assertSame(600, VocabWord::query()->whereHas('topic', fn ($query) => $query->where('is_published', true))->count());
        $this->assertSame(60, VocabExercise::query()->whereHas('topic', fn ($query) => $query->where('is_published', true))->count());
    }
}
