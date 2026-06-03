<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\ExamVersionValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

final class ExamVersionValidatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_fixture_data_passes_full_structural_validation(): void
    {
        $fixture = $this->validFixtureData();

        $errors = app(ExamVersionValidator::class)->validateFixtureData(...$fixture);

        $this->assertSame([], $errors);
    }

    public function test_validator_rejects_invalid_mcq_and_speaking_solution_shape(): void
    {
        $fixture = $this->validFixtureData();
        $listeningItems = $fixture[1]->all();
        $listeningItems[0] = $listeningItems[0]->map(function (array $item, int $index): array {
            if ($index !== 0) {
                return $item;
            }

            return [
                ...$item,
                'options' => ['A', 'B', 'C'],
                'correct_index' => 4,
            ];
        });
        $fixture[1] = collect($listeningItems);

        $speakingParts = $fixture[5]->all();
        $speakingParts[1]['content']['solutions'] = ['Improve buses', 'Build more roads'];
        $fixture[5] = collect($speakingParts);

        $errors = app(ExamVersionValidator::class)->validateFixtureData(...$fixture);

        $this->assertNotEmpty($errors);
        $this->assertTrue(collect($errors)->contains(fn (string $error): bool => str_contains($error, 'options: yêu cầu 4')));
        $this->assertTrue(collect($errors)->contains(fn (string $error): bool => str_contains($error, 'correct_index')));
        $this->assertTrue(collect($errors)->contains(fn (string $error): bool => str_contains($error, 'solutions: yêu cầu 3')));
    }

    public function test_official_validation_checks_reading_total_word_range(): void
    {
        $fixture = $this->validFixtureData('Short passage.');

        $errors = app(ExamVersionValidator::class)->validateOfficialFixtureData(...$fixture);

        $this->assertTrue(collect($errors)->contains(fn (string $error): bool => str_contains($error, 'Reading total words')));
    }

    public function test_current_content_fixture_exam_versions_are_structurally_valid(): void
    {
        $data = json_decode((string) file_get_contents(database_path('fixtures/content.json')), true, 512, JSON_THROW_ON_ERROR);
        $validator = app(ExamVersionValidator::class);

        foreach ($data['exam_versions'] as $version) {
            $versionId = $version['id'];
            $sections = collect($data['exam_version_listening_sections'])
                ->where('exam_version_id', $versionId)
                ->values();
            $passages = collect($data['exam_version_reading_passages'])
                ->where('exam_version_id', $versionId)
                ->values();
            $writingTasks = collect($data['exam_version_writing_tasks'])
                ->where('exam_version_id', $versionId)
                ->values();
            $speakingParts = collect($data['exam_version_speaking_parts'])
                ->where('exam_version_id', $versionId)
                ->values();

            $sectionIds = $sections->pluck('id')->all();
            $passageIds = $passages->pluck('id')->all();
            $errors = $validator->validateFixtureData(
                $sections,
                collect($data['exam_version_listening_items'])->whereIn('section_id', $sectionIds)->groupBy('section_id'),
                $passages,
                collect($data['exam_version_reading_items'])->whereIn('passage_id', $passageIds)->groupBy('passage_id'),
                $writingTasks,
                $speakingParts,
            );

            $this->assertSame([], $errors, "Exam version {$versionId} should be structurally valid.");
        }
    }

    /**
     * @return array{0: Collection<int, array<string, mixed>>, 1: Collection<int, Collection<int, array<string, mixed>>>, 2: Collection<int, array<string, mixed>>, 3: Collection<int, Collection<int, array<string, mixed>>>, 4: Collection<int, array<string, mixed>>, 5: Collection<int, array<string, mixed>>}
     */
    private function validFixtureData(?string $readingText = null): array
    {
        $sections = [];
        $listeningItems = [];
        $sectionIndex = 0;
        foreach ([1 => [8, 1], 2 => [3, 4], 3 => [3, 5]] as $part => [$sectionCount, $itemCount]) {
            for ($section = 1; $section <= $sectionCount; $section++) {
                $sections[] = [
                    'part' => $part,
                    'part_title' => "Part {$part} Section {$section}",
                    'duration_minutes' => $part === 3 ? 6 : ($part === 2 ? 4 : 1),
                    'transcript' => 'This is a short VSTEP listening transcript for validation.',
                ];

                for ($item = 1; $item <= $itemCount; $item++) {
                    $listeningItems[] = $this->mcqItem('section_index', $sectionIndex, $item);
                }

                $sectionIndex++;
            }
        }

        $passages = [];
        $readingItems = [];
        $passage = $readingText ?? str_repeat('education policy improves access and supports learners. ', 100);
        for ($part = 1; $part <= 4; $part++) {
            $passages[] = [
                'part' => $part,
                'title' => "Reading Passage {$part}",
                'duration_minutes' => 15,
                'passage' => $passage,
            ];

            for ($item = 1; $item <= 10; $item++) {
                $readingItems[] = $this->mcqItem('passage_index', $part - 1, $item);
            }
        }

        return [
            collect($sections),
            collect($listeningItems)->groupBy('section_index'),
            collect($passages),
            collect($readingItems)->groupBy('passage_index'),
            collect([
                [
                    'part' => 1,
                    'task_type' => 'letter',
                    'duration_minutes' => 20,
                    'prompt' => 'Write a letter to a friend about a problem and propose a solution.',
                    'min_words' => 120,
                    'instructions' => ['explain the problem', 'suggest a solution'],
                ],
                [
                    'part' => 2,
                    'task_type' => 'essay',
                    'duration_minutes' => 40,
                    'prompt' => 'Some people believe online learning is effective. Discuss both views and give your opinion.',
                    'min_words' => 250,
                    'instructions' => ['discuss both views', 'give your opinion'],
                ],
            ]),
            collect([
                [
                    'part' => 1,
                    'type' => 'social',
                    'duration_minutes' => 3,
                    'speaking_seconds' => 180,
                    'content' => [
                        'topics' => [
                            ['name' => 'Study', 'questions' => ['What do you study?', 'Why did you choose it?', 'How do you prepare for exams?']],
                            ['name' => 'Free time', 'questions' => ['What do you do in your free time?', 'Do you prefer indoor or outdoor activities?', 'Why?']],
                        ],
                    ],
                ],
                [
                    'part' => 2,
                    'type' => 'solution',
                    'duration_minutes' => 4,
                    'speaking_seconds' => 240,
                    'content' => [
                        'situation' => 'Your school wants to improve student health.',
                        'solutions' => ['Improve buses', 'Build a gym', 'Offer health workshops'],
                        'task' => 'Choose the best solution and explain your reasons.',
                    ],
                ],
                [
                    'part' => 3,
                    'type' => 'topic',
                    'duration_minutes' => 5,
                    'speaking_seconds' => 300,
                    'content' => [
                        'topic' => 'Technology in education',
                        'prompt' => 'Discuss the benefits and risks of using technology in education.',
                        'follow_up_questions' => ['What is the biggest benefit?', 'What is one risk?', 'How can schools use technology responsibly?'],
                    ],
                ],
            ]),
        ];
    }

    /** @return array<string, mixed> */
    private function mcqItem(string $parentKey, int $parentIndex, int $displayOrder): array
    {
        return [
            $parentKey => $parentIndex,
            'display_order' => $displayOrder,
            'stem' => 'What is the best answer?',
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_index' => 0,
        ];
    }
}
