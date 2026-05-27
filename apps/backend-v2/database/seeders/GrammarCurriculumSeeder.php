<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GrammarCommonMistake;
use App\Models\GrammarExample;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarPointFunction;
use App\Models\GrammarPointLevel;
use App\Models\GrammarPointTask;
use App\Models\GrammarStructure;
use App\Models\GrammarVstepTip;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class GrammarCurriculumSeeder extends Seeder
{
    /** @var array<string, string> */
    private const CEFR_DESCRIPTORS = [
        'A1' => 'Có thể sử dụng mẫu câu rất cơ bản để cung cấp thông tin cá nhân và mô tả quen thuộc.',
        'A2' => 'Có thể trao đổi thông tin đơn giản về quá khứ, kế hoạch và nhu cầu thường ngày.',
        'B1' => 'Có thể nối câu và giải thích trải nghiệm, lý do hoặc quan điểm quen thuộc.',
        'B2' => 'Có thể kiểm soát cấu trúc đa dạng để lập luận rõ và tương đối chính xác.',
        'C1' => 'Có thể lựa chọn cấu trúc linh hoạt, chính xác và phù hợp văn phong học thuật.',
    ];

    /** @var array<string, string> */
    private const TASK_USE_CASES = [
        'SP1' => 'Áp dụng khi trả lời câu hỏi cá nhân ngắn trong Speaking Part 1.',
        'SP2' => 'Áp dụng khi phát triển lựa chọn và lời khuyên trong Speaking Part 2.',
        'SP3' => 'Áp dụng khi trình bày và bảo vệ quan điểm trong Speaking Part 3.',
        'WT1' => 'Áp dụng khi viết thư hoặc thông tin thực tế trong Writing Task 1.',
        'WT2' => 'Áp dụng khi phát triển lập luận trong Writing Task 2.',
        'READ' => 'Áp dụng khi nhận diện quan hệ ý nghĩa trong bài đọc.',
    ];

    public function run(): void
    {
        /** @var list<array<string, string>> $curriculum */
        $curriculum = require database_path('fixtures/grammar_curriculum.php');
        /** @var array<string, array{examples: list<array{string, string, string}>, mistake: array{string, string, string}, tip: string}> $enrichment */
        $enrichment = require database_path('fixtures/grammar_curriculum_enrichment.php');

        DB::transaction(function () use ($curriculum, $enrichment): void {
            $previousByLevel = [];

            foreach ($curriculum as $order => $definition) {
                $prerequisites = isset($previousByLevel[$definition['level']])
                    ? [$previousByLevel[$definition['level']]]
                    : [];
                $point = GrammarPoint::query()->updateOrCreate(
                    ['slug' => $definition['slug']],
                    [
                        'name' => $definition['name'],
                        'vietnamese_name' => $definition['vi'],
                        'summary' => $definition['summary'],
                        'learning_objective' => $this->objective($definition),
                        'success_criteria' => $this->successCriteria($definition),
                        'prerequisite_slugs' => $prerequisites,
                        'cefr_descriptor' => self::CEFR_DESCRIPTORS[$definition['level']],
                        'vstep_use_case' => self::TASK_USE_CASES[$definition['task']],
                        'assessed_by' => ['guided-practice', "{$definition['level']}-checkpoint"],
                        'is_checkpoint' => false,
                        'category' => $definition['category'],
                        'display_order' => $order + 1,
                        'is_published' => true,
                    ],
                );

                $this->syncTags($point, $definition);
                $this->syncStructures($point, $definition);
                $content = $enrichment[$definition['slug']];
                $this->syncExamples($point, $definition, $content);
                $this->syncMistakesAndTip($point, $definition, $content);
                $this->syncExercises($point, $definition, $content);
                $previousByLevel[$definition['level']] = $definition['slug'];
            }

            $this->syncCheckpoints($curriculum);
        });

        $lessonCount = count($curriculum);
        $this->command?->info("Grammar curriculum seeded: {$lessonCount} lessons x 5 MCQ, 5 checkpoints x exercises (answers shuffled).");
    }

    /**
     * @param  array<string, string>  $definition
     */
    private function syncTags(GrammarPoint $point, array $definition): void
    {
        GrammarPointLevel::query()->where('grammar_point_id', $point->id)->delete();
        GrammarPointTask::query()->where('grammar_point_id', $point->id)->delete();
        GrammarPointFunction::query()->where('grammar_point_id', $point->id)->delete();

        GrammarPointLevel::query()->create(['grammar_point_id' => $point->id, 'level' => $definition['level']]);
        GrammarPointTask::query()->create(['grammar_point_id' => $point->id, 'task' => $definition['task']]);
        GrammarPointFunction::query()->create(['grammar_point_id' => $point->id, 'function' => $definition['function']]);
    }

    /**
     * @param  array<string, string>  $definition
     */
    private function syncStructures(GrammarPoint $point, array $definition): void
    {
        $rows = [
            [$definition['s1'], 'Mẫu cấu trúc chính cần sử dụng chính xác.'],
            [$definition['s2'], 'Biến thể giúp mở rộng phạm vi diễn đạt.'],
        ];

        foreach ($rows as $order => [$template, $description]) {
            GrammarStructure::query()->updateOrCreate(
                ['id' => $this->contentId($definition['slug'], 'structure', $order)],
                ['grammar_point_id' => $point->id, 'template' => $template, 'description' => $description, 'display_order' => $order + 1],
            );
        }

    }

    /**
     * @param  array<string, string>  $definition
     * @param  array{examples: list<array{string, string, string}>, mistake: array{string, string, string}, tip: string}  $content
     */
    private function syncExamples(GrammarPoint $point, array $definition, array $content): void
    {
        $rows = array_merge(
            [[$definition['en'], $definition['translation'], 'Ví dụ mục tiêu.']],
            $content['examples'],
        );

        foreach ($rows as $order => [$en, $vi, $note]) {
            GrammarExample::query()->updateOrCreate(
                ['id' => $this->contentId($definition['slug'], 'example', $order)],
                ['grammar_point_id' => $point->id, 'en' => $en, 'vi' => $vi, 'note' => $note, 'display_order' => $order + 1],
            );
        }

    }

    /**
     * @param  array<string, string>  $definition
     * @param  array{examples: list<array{string, string, string}>, mistake: array{string, string, string}, tip: string}  $content
     */
    private function syncMistakesAndTip(GrammarPoint $point, array $definition, array $content): void
    {
        $mistakes = [
            [$definition['wrong'], $definition['correct'], 'Sửa theo cấu trúc mục tiêu của bài.'],
            $content['mistake'],
        ];

        foreach ($mistakes as $order => [$wrong, $correct, $explanation]) {
            GrammarCommonMistake::query()->updateOrCreate(
                ['id' => $this->contentId($definition['slug'], 'mistake', $order)],
                [
                    'grammar_point_id' => $point->id,
                    'wrong' => $wrong,
                    'correct' => $correct,
                    'explanation' => $explanation,
                    'display_order' => $order + 1,
                ],
            );
        }

        GrammarVstepTip::query()->updateOrCreate(
            ['id' => $this->contentId($definition['slug'], 'tip', 0)],
            [
                'grammar_point_id' => $point->id,
                'task' => $definition['task'],
                'tip' => $content['tip'],
                'example' => $definition['en'],
                'display_order' => 1,
            ],
        );

    }

    /**
     * @param  array<string, string>  $definition
     * @param  array{examples: list<array{string, string, string}>, mistake: array{string, string, string}, tip: string}  $content
     */
    private function syncExercises(GrammarPoint $point, array $definition, array $content): void
    {
        [$secondWrong, $secondCorrect, $secondExplanation] = $content['mistake'];
        $correct = $definition['correct'];
        $wrong = $definition['wrong'];
        $summary = $definition['summary'];

        $exercises = [
            [
                'Chọn câu đúng về ngữ pháp.',
                [$wrong, $correct, $secondWrong, 'Cả ba câu trên đều đúng.'],
                $correct,
                $this->explanation($correct, $summary),
            ],
            [
                'Chọn câu sai về ngữ pháp.',
                [$correct, $secondCorrect, $wrong, 'Cả ba câu trên đều sai.'],
                $wrong,
                $this->explanation($correct, $summary),
            ],
            [
                'Chọn câu đúng trong ngữ cảnh khác.',
                [$wrong, $secondWrong, $secondCorrect, 'Cả ba câu trên đều đúng.'],
                $secondCorrect,
                $secondExplanation,
            ],
            [
                'Chọn câu sai trong ngữ cảnh khác.',
                [$correct, $secondCorrect, $secondWrong, 'Tất cả đều sai.'],
                $secondWrong,
                $secondExplanation,
            ],
            [
                'Chọn câu sử dụng đúng cấu trúc ngữ pháp.',
                [$secondWrong, $correct, $wrong, 'Không câu nào đúng.'],
                $correct,
                $this->explanation($correct, $summary),
            ],
        ];

        foreach ($exercises as $order => [$prompt, $options, $correctAnswer, $explanation]) {
            $this->createExercise($point->id, $order, $prompt, $options, $correctAnswer, $explanation, $definition['slug']);
        }

        $this->retireManagedExercises($point, count($exercises), max(count($exercises), 8));
    }

    /**
     * @param  string[]  $options
     */
    private function createExercise(string $pointId, int $order, string $prompt, array $options, string $correctAnswer, string $explanation, string $slug): void
    {
        $shuffled = $options;
        shuffle($shuffled);
        $correctIndex = array_search($correctAnswer, $shuffled, true);
        if ($correctIndex === false) {
            $correctIndex = 0;
        }

        GrammarExercise::query()->updateOrCreate(
            ['id' => $this->contentId($slug, 'exercise', $order)],
            [
                'grammar_point_id' => $pointId,
                'kind' => 'mcq',
                'payload' => [
                    'prompt' => $prompt,
                    'options' => array_values($shuffled),
                    'correct_index' => $correctIndex,
                ],
                'explanation' => $explanation,
                'display_order' => $order + 1,
                'is_active' => true,
            ],
        );
    }

    /**
     * @param  list<array<string, string>>  $curriculum
     */
    private function syncCheckpoints(array $curriculum): void
    {
        foreach (array_keys(self::CEFR_DESCRIPTORS) as $index => $level) {
            $lessons = array_values(array_filter(
                $curriculum,
                fn (array $definition): bool => $definition['level'] === $level,
            ));
            $point = GrammarPoint::query()->updateOrCreate(
                ['slug' => strtolower($level).'-checkpoint'],
                [
                    'name' => "{$level} Grammar Checkpoint",
                    'vietnamese_name' => "Bài kiểm tra tổng hợp {$level}",
                    'summary' => "Ôn tập hỗn hợp sáu điểm ngữ pháp ở mức {$level} trước khi chuyển cấp.",
                    'learning_objective' => "Vận dụng phối hợp các điểm ngữ pháp {$level} trong ngữ cảnh mới.",
                    'success_criteria' => 'Hoàn thành các câu hỏi hỗn hợp và đạt trạng thái thành thạo bằng ít nhất bốn câu đúng khác nhau.',
                    'prerequisite_slugs' => array_column($lessons, 'slug'),
                    'cefr_descriptor' => self::CEFR_DESCRIPTORS[$level],
                    'vstep_use_case' => 'Checkpoint kiểm tra mức sẵn sàng trước khi chuyển sang phạm vi ngữ pháp tiếp theo.',
                    'assessed_by' => ['level-checkpoint'],
                    'is_checkpoint' => true,
                    'category' => 'task',
                    'display_order' => 100 + $index,
                    'is_published' => true,
                ],
            );
            $tag = ['level' => $level, 'task' => $lessons[0]['task'], 'function' => 'accuracy'];
            $this->syncTags($point, $tag);
            $this->syncCheckpointExercises($point, $lessons);
        }
    }

    /**
     * @param  list<array<string, string>>  $lessons
     */
    private function syncCheckpointExercises(GrammarPoint $point, array $lessons): void
    {
        $total = count($lessons);

        foreach ($lessons as $order => $definition) {
            $next = $lessons[($order + 1) % $total];
            $this->createExercise(
                $point->id,
                $order,
                "Checkpoint {$definition['level']}: chọn câu đúng về {$definition['vi']}.",
                [$definition['wrong'], $definition['correct'], $next['wrong'], 'Cả ba câu trên đều đúng.'],
                $definition['correct'],
                $this->explanation($definition['correct'], $definition['summary']),
                $point->slug,
            );
        }

        $this->retireManagedExercises($point, $total, max($total, 8));
    }

    /**
     * @param  array<string, string>  $definition
     */
    private function objective(array $definition): string
    {
        return "Sau bài học, người học có thể {$definition['summary']}";
    }

    /**
     * @param  array<string, string>  $definition
     */
    private function successCriteria(array $definition): string
    {
        return "Nhận diện chính xác câu dùng {$definition['vi']} trong hai ngữ cảnh khác nhau.";
    }

    private function explanation(string $correct, string $rule): string
    {
        return "Đáp án đúng: {$correct} Quy tắc: {$rule}";
    }

    private function retireManagedExercises(GrammarPoint $point, int $activeCount, int $previousCount): void
    {
        $retiredIds = [];
        for ($order = $activeCount; $order < $previousCount; $order++) {
            $retiredIds[] = $this->contentId($point->slug, 'exercise', $order);
        }

        GrammarExercise::query()
            ->where('grammar_point_id', $point->id)
            ->whereIn('id', $retiredIds)
            ->update(['is_active' => false]);
    }

    private function contentId(string $slug, string $child, int $order): string
    {
        $hash = md5("grammar-curriculum:{$slug}:{$child}:{$order}");

        return substr($hash, 0, 8).'-'.substr($hash, 8, 4).'-4'.substr($hash, 13, 3).'-a'.substr($hash, 17, 3).'-'.substr($hash, 20, 12);
    }
}
