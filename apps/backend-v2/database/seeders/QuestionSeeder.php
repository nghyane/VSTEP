<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\BloomLevel;
use App\Enums\Level;
use App\Enums\Skill;
use App\Models\KnowledgePoint;
use App\Models\Question;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $kpIds = KnowledgePoint::pluck('id', 'name');

        foreach (['listening', 'reading', 'writing', 'speaking'] as $skill) {
            $path = database_path("seeders/data/questions/{$skill}.json");

            if (! File::exists($path)) {
                $this->command?->warn("Skipping {$skill}: {$path} not found");

                continue;
            }

            $questions = json_decode(File::get($path), true);
            $count = 0;

            foreach ($questions as $data) {
                $question = Question::updateOrCreate(
                    [
                        'skill' => Skill::from($data['skill']),
                        'level' => Level::from($data['level']),
                        'part' => $data['part'],
                        'topic' => $data['topic'],
                    ],
                    [
                        'bloom_level' => isset($data['bloom_level']) ? BloomLevel::from($data['bloom_level']) : null,
                        'content' => $data['content'],
                        'answer_key' => $data['answer_key'] ?? null,
                        'is_active' => true,
                        'verified_at' => now(),
                    ],
                );

                if (! empty($data['knowledge_points'])) {
                    $ids = collect($data['knowledge_points'])
                        ->map(fn (string $name) => $kpIds[$name] ?? null)
                        ->filter()
                        ->toArray();

                    $question->knowledgePoints()->syncWithoutDetaching($ids);
                }

                $count++;
            }

            $this->command?->info("{$skill}: {$count} questions");
        }
    }
}
