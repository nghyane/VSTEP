<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class VocabCurriculumSeeder extends Seeder
{
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

    /** @var array<string, string> */
    private const TOPIC_KEYS = [
        'Gia đình' => 'gia-dinh',
        'Giáo dục' => 'giao-duc',
        'Sức khỏe' => 'suc-khoe',
        'Môi trường' => 'moi-truong',
        'Công việc' => 'cong-viec',
        'Công nghệ' => 'cong-nghe',
    ];

    /** @var array<string, string> */
    private const TOPIC_ICONS = [
        'Gia đình' => 'family',
        'Giáo dục' => 'graduation',
        'Sức khỏe' => 'heart',
        'Môi trường' => 'leaf',
        'Công việc' => 'briefcase',
        'Công nghệ' => 'book',
    ];

    /** @var array<string, string> */
    private const ENGLISH_TOPIC_NAMES = [
        'Gia đình' => 'family life',
        'Giáo dục' => 'education',
        'Sức khỏe' => 'health',
        'Môi trường' => 'the environment',
        'Công việc' => 'work',
        'Công nghệ' => 'technology',
    ];

    public function run(): void
    {
        /** @var array<string, array<string, list<array{string, string, string, string}>>> $curriculum */
        $curriculum = require database_path('fixtures/vocab_curriculum.php');
        /** @var array<string, array<string, list<string>>> $supplement */
        $supplement = require database_path('fixtures/vocab_curriculum_supplement.php');
        DB::transaction(function () use ($curriculum, $supplement): void {
            $topicOrder = 0;
            foreach (self::TOPIC_KEYS as $topicName => $topicKey) {
                foreach (self::LEVELS as $level) {
                    $topicOrder++;
                    $topic = VocabTopic::query()->updateOrCreate(
                        ['slug' => "curriculum-{$topicKey}-".strtolower($level)],
                        [
                            'name' => $topicName,
                            'description' => "Từ vựng chủ đề {$topicName} ở cấp độ {$level}, phát triển dần từ giao tiếp cơ bản đến diễn đạt học thuật.",
                            'level' => $level,
                            'icon_key' => self::TOPIC_ICONS[$topicName],
                            'display_order' => $topicOrder,
                            'is_published' => true,
                        ],
                    );

                    $words = array_merge(
                        $curriculum[$topicName][$level],
                        $this->supplementalWords($topicName, $level, $supplement[$topicName][$level]),
                    );

                    $this->syncWords($topic, $words);
                    $this->syncExercises($topic, $words);
                }
            }
        });

        $this->command?->info('Vocabulary curriculum seeded: 30 topics, 600 words, 60 exercises.');
    }

    /**
     * @param  list<string>  $items
     * @return list<array{string, string, string, string}>
     */
    private function supplementalWords(string $topicName, string $level, array $items): array
    {
        return array_map(function (string $item) use ($topicName, $level): array {
            [$word, $definition] = explode('|', $item, 2);
            $context = self::ENGLISH_TOPIC_NAMES[$topicName];
            $example = "The phrase \"{$word}\" is useful in a {$level} discussion of {$context}.";

            return [$word, 'noun', $definition, $example];
        }, $items);
    }

    /**
     * @param  list<array{string, string, string, string}>  $words
     */
    private function syncWords(VocabTopic $topic, array $words): void
    {
        foreach ($words as $displayOrder => [$word, $partOfSpeech, $definition, $example]) {
            VocabWord::query()->updateOrCreate(
                ['topic_id' => $topic->id, 'word' => $word],
                [
                    'part_of_speech' => $partOfSpeech,
                    'definition' => $definition,
                    'example' => $example,
                    'synonyms' => [],
                    'collocations' => [],
                    'word_family' => [],
                    'vstep_tip' => null,
                    'display_order' => $displayOrder + 1,
                ],
            );
        }
    }

    /**
     * @param  list<array{string, string, string, string}>  $words
     */
    private function syncExercises(VocabTopic $topic, array $words): void
    {
        foreach (array_slice($words, 0, 2) as $index => [$word, $partOfSpeech, $definition]) {
            $distractors = collect($words)
                ->pluck(2)
                ->reject(fn (string $candidate): bool => $candidate === $definition)
                ->values()
                ->take(3)
                ->all();

            if (count($distractors) < 3) {
                continue;
            }

            $correctIndex = $index % 4;
            $options = $distractors;
            array_splice($options, $correctIndex, 0, [$definition]);

            VocabExercise::query()->updateOrCreate(
                ['topic_id' => $topic->id, 'display_order' => $index + 1],
                [
                    'kind' => 'mcq',
                    'payload' => [
                        'prompt' => "Chọn nghĩa đúng của \"{$word}\" ({$partOfSpeech}).",
                        'options' => array_values($options),
                        'correct_index' => $correctIndex,
                    ],
                    'explanation' => "\"{$word}\" nghĩa là {$definition}.",
                ],
            );
        }
    }
}
