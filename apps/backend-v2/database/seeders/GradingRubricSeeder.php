<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradingRubric;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed one stable VSTEP grading rubric per productive skill.
 *
 * Public VSTEP facts used here:
 * - Writing Task 1 is a letter/email of at least 120 words and contributes 1/3
 *   of the final Writing skill score.
 * - Writing Task 2 is an essay of at least 250 words and contributes 2/3.
 * - Speaking has three parts: social interaction, solution discussion, topic development.
 *
 * The scoring params below are internal automated-calibration rules for this app;
 * they are not claimed to be official MOET examiner descriptors.
 */
class GradingRubricSeeder extends Seeder
{
    private const PRODUCTIVE_SKILLS = ['writing', 'speaking'];

    private const STABLE_VERSION = 1;

    private const SCORING_FORMULA = 'equal_weighted_mean_rounded_half';

    public function run(): void
    {
        DB::transaction(function (): void {
            $this->deleteExistingRubrics(self::PRODUCTIVE_SKILLS);
            $this->seedWritingRubric();
            $this->seedSpeakingRubric();
        });
    }

    /** @param list<string> $skills */
    private function deleteExistingRubrics(array $skills): void
    {
        $ids = GradingRubric::query()->whereIn('skill', $skills)->pluck('id');

        if ($ids->isNotEmpty()) {
            DB::table('scoring_policies')->whereIn('rubric_id', $ids)->delete();
        }

        GradingRubric::query()->whereIn('skill', $skills)->delete();
    }

    private function seedWritingRubric(): void
    {
        $this->createRubric(
            skill: 'writing',
            name: 'VSTEP Writing Rubric Stable',
            sourceReference: 'VSTEP.3-5 public test format: Task 1 letter/email >=120 words = 1/3, '
                .'Task 2 essay >=250 words = 2/3. Four analytic criteria use equal weights because no '
                .'public official criterion weights are available; scoring thresholds are internal calibration.',
            criteria: $this->writingCriteria(),
        );
    }

    private function seedSpeakingRubric(): void
    {
        $this->createRubric(
            skill: 'speaking',
            name: 'VSTEP Speaking Rubric Stable',
            sourceReference: 'VSTEP.3-5 public test format: Speaking has social interaction, solution discussion, '
                .'and topic development. Criteria and automated thresholds are internal calibration for consistent '
                .'practice feedback.',
            criteria: $this->speakingCriteria(),
        );
    }

    /** @param list<array<string,mixed>> $criteria */
    private function createRubric(string $skill, string $name, string $sourceReference, array $criteria): void
    {
        GradingRubric::create([
            'skill' => $skill,
            'version' => self::STABLE_VERSION,
            'name' => $name,
            'source_reference' => $sourceReference,
            'criteria' => $criteria,
            'scoring_formula' => self::SCORING_FORMULA,
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);
    }

    /** @return list<array<string,mixed>> */
    private function writingCriteria(): array
    {
        return [
            $this->criterion('task_fulfillment', 'Task Fulfillment', 'Hoàn thành yêu cầu đề', [
                '10' => 'Đáp ứng đầy đủ yêu cầu đề, mục đích/lập trường rõ ràng và luận điểm được phát triển thuyết phục.',
                '8' => 'Đáp ứng hầu hết yêu cầu chính; ý tưởng nhìn chung phù hợp và được phát triển tương đối đầy đủ.',
                '6' => 'Đáp ứng yêu cầu đề ở mức cơ bản nhưng một số phần còn thiếu phát triển hoặc dẫn chứng chưa đủ.',
                '4' => 'Chỉ đáp ứng một phần yêu cầu; nội dung phát triển hạn chế hoặc lặp lại.',
                '0' => 'Không có bài làm đủ điều kiện chấm hoặc bài làm lạc đề.',
            ], [
                'coverage_multiplier' => 7,
                'task1_multiplier' => 7,
                'position_bonus' => 0.5,
                'irrelevant_penalty' => 2,
                'default_points_required' => 3,
                'word_minimum_task1' => 120,
                'word_minimum_task2' => 250,
                'depth_minimum' => 0.25,
                'non_assessable_word_limit' => 10,
                'severity' => 'standard',
                'severe_minimum_words_task1' => 60,
                'severe_minimum_words_task2' => 125,
                'minimum_covered_points' => 1,
                'short_response_caps' => [
                    ['max_words' => 10, 'cap' => 1],
                    ['max_words' => 30, 'cap' => 2],
                ],
                'short_essay_caps' => [
                    ['max_words' => 10, 'cap' => 1],
                    ['max_words' => 30, 'cap' => 2],
                ],
                'task_fulfillment_word_caps' => [
                    ['max_words' => 80, 'cap' => 4],
                    ['max_words' => 120, 'cap' => 6],
                ],
                'task_fulfillment_word_caps_task1' => [
                    ['max_words' => 80, 'cap' => 4],
                    ['max_words' => 120, 'cap' => 6],
                ],
                'task_fulfillment_word_caps_task2' => [
                    ['max_words' => 80, 'cap' => 4],
                    ['max_words' => 120, 'cap' => 6],
                    ['max_words' => 180, 'cap' => 8],
                    ['max_words' => 220, 'cap' => 9],
                ],
                'tf_cap_ratio' => 1.3,
                'sub_signals' => [
                    'tone_register' => [
                        'enabled' => true,
                        'weight' => 1.0,
                        'max_penalty' => 2.0,
                        'part2' => [
                            'weight' => 1.0,
                            'max_penalty' => 2.0,
                            'thresholds' => [
                                ['max_errors' => 0, 'penalty' => 0],
                                ['max_errors' => 1, 'penalty' => 0.5],
                                ['max_errors' => 3, 'penalty' => 1.0],
                                ['max_errors' => 6, 'penalty' => 2.0],
                            ],
                        ],
                    ],
                ],
            ], 0.25),
            $this->criterion('organization', 'Organization', 'Bố cục bài viết', [
                '10' => 'Ý tưởng được sắp xếp logic, chia đoạn hiệu quả và dùng phương tiện liên kết tự nhiên.',
                '8' => 'Bố cục rõ ràng; cách chia đoạn và liên kết nhìn chung hiệu quả.',
                '6' => 'Tổ chức bài có thể hiểu được nhưng liên kết hoặc chia đoạn còn máy móc.',
                '4' => 'Bố cục yếu; ý tưởng có thể chỉ được liệt kê hoặc khó theo dõi.',
                '0' => 'Không có tổ chức bài viết đủ điều kiện đánh giá.',
            ], [
                'base' => 1,
                'para_bonus' => [1 => 1, 2 => 3, 3 => 4],
                'linking_factor' => 0.5,
                'linking_density_factor' => 4,
                'linking_cap' => 3,
                'variety_thresholds' => [
                    ['threshold' => 4, 'bonus' => 1],
                    ['threshold' => 6, 'bonus' => 2],
                ],
                'compact_threshold' => 8,
                'compact_penalty' => 1,
            ], 0.25),
            $this->criterion('grammar', 'Grammar', 'Ngữ pháp', [
                '10' => 'Sử dụng đa dạng cấu trúc ngữ pháp linh hoạt và chính xác.',
                '8' => 'Sử dụng tốt cả cấu trúc đơn giản và phức tạp, chỉ mắc lỗi không thường xuyên.',
                '6' => 'Có kết hợp cấu trúc đơn giản và một số cấu trúc phức tạp; lỗi khá rõ nhưng nghĩa vẫn hiểu được.',
                '4' => 'Chủ yếu dùng cấu trúc đơn giản và mắc lỗi thường xuyên.',
                '0' => 'Không có ngữ pháp đủ điều kiện đánh giá.',
            ], [
                'type' => 'structure_count',
                'band_thresholds' => [0 => 4, 1 => 5, 2 => 5.5, 3 => 6, 4 => 7, 5 => 7.5, 7 => 9, 9 => 10],
                'accuracy_factor' => 5,
                'max_accuracy' => ['0-1' => 5, '2-3' => 6, '4-5' => 8, '6+' => 10],
                'sub_signals' => [
                    'punctuation' => [
                        'enabled' => true,
                        'weight' => 1.0,
                        'max_penalty' => 1.5,
                        'thresholds' => [
                            ['max_errors' => 0, 'penalty' => 0],
                            ['max_errors' => 2, 'penalty' => 0.5],
                            ['max_errors' => 5, 'penalty' => 1.0],
                            ['max_errors' => 10, 'penalty' => 1.5],
                        ],
                    ],
                ],
            ], 0.25),
            $this->criterion('vocabulary', 'Vocabulary', 'Từ vựng', [
                '10' => 'Sử dụng vốn từ rộng, chính xác và tự nhiên theo chủ đề.',
                '8' => 'Sử dụng từ vựng theo chủ đề khá đa dạng, lựa chọn từ nhìn chung phù hợp.',
                '6' => 'Có đủ từ vựng để hoàn thành nhiệm vụ nhưng còn lặp từ hoặc thiếu chính xác.',
                '4' => 'Từ vựng cơ bản, lặp lại nhiều; lỗi chọn từ có thể ảnh hưởng độ rõ nghĩa.',
                '0' => 'Không có từ vựng đủ điều kiện đánh giá.',
            ], [
                'base' => 2,
                'cap' => 10,
                'unique_thresholds' => [
                    ['threshold' => 0.50, 'bonus' => 1],
                    ['threshold' => 0.60, 'bonus' => 2],
                    ['threshold' => 0.70, 'bonus' => 3],
                ],
                'length_thresholds' => [
                    ['threshold' => 5.0, 'bonus' => 1],
                    ['threshold' => 6.0, 'bonus' => 2],
                ],
                'readability_thresholds' => [
                    ['threshold' => 10, 'bonus' => 1],
                    ['threshold' => 12, 'bonus' => 2],
                ],
                'complex_thresholds' => [
                    ['threshold' => 2, 'bonus' => 1],
                    ['threshold' => 5, 'bonus' => 2],
                ],
                'cefr_thresholds' => [
                    ['threshold' => 2.5, 'bonus' => 1],
                    ['threshold' => 3.0, 'bonus' => 2],
                    ['threshold' => 3.5, 'bonus' => 3],
                    ['threshold' => 4.0, 'bonus' => 4],
                ],
                'advanced_thresholds' => [
                    ['threshold' => 0.20, 'bonus' => 1],
                    ['threshold' => 0.35, 'bonus' => 2],
                ],
                'model' => [
                    'empty_score' => 2,
                    'feature_weights' => [
                        'lexical_range' => 0.45,
                        'sophistication' => 0.25,
                        'diversity' => 0.20,
                        'readability' => 0.10,
                    ],
                    'confidence' => [
                        'min_classified_tokens' => 30,
                        'range_baseline' => 4,
                    ],
                    'lexical_range_bands' => [
                        ['threshold' => 0.0, 'band' => 2],
                        ['threshold' => 2.0, 'band' => 6],
                        ['threshold' => 2.5, 'band' => 7],
                        ['threshold' => 3.0, 'band' => 8],
                        ['threshold' => 3.5, 'band' => 9],
                        ['threshold' => 4.0, 'band' => 10],
                    ],
                    'sophistication_bands' => [
                        ['threshold' => 0.0, 'band' => 2],
                        ['threshold' => 2.0, 'band' => 6],
                        ['threshold' => 4.0, 'band' => 7],
                        ['threshold' => 6.0, 'band' => 8],
                        ['threshold' => 8.0, 'band' => 9],
                    ],
                    'diversity_bands' => [
                        ['threshold' => 0.0, 'band' => 2],
                        ['threshold' => 0.45, 'band' => 5],
                        ['threshold' => 0.55, 'band' => 6],
                        ['threshold' => 0.65, 'band' => 7],
                        ['threshold' => 0.75, 'band' => 8],
                    ],
                    'readability_bands' => [
                        ['threshold' => 0.0, 'band' => 2],
                        ['threshold' => 8.0, 'band' => 6],
                        ['threshold' => 10.0, 'band' => 7],
                        ['threshold' => 12.0, 'band' => 8],
                    ],
                    'control' => [
                        'spelling_penalty_per_error' => 0.25,
                        'max_spelling_penalty' => 1.5,
                    ],
                ],
                'sub_signals' => [
                    'spelling' => [
                        'enabled' => true,
                        'weight' => 1.0,
                        'max_penalty' => 1.5,
                        'thresholds' => [
                            ['max_errors' => 0, 'penalty' => 0],
                            ['max_errors' => 2, 'penalty' => 0.5],
                            ['max_errors' => 5, 'penalty' => 1.0],
                            ['max_errors' => 10, 'penalty' => 1.5],
                        ],
                    ],
                ],
            ], 0.25),
        ];
    }

    /** @return list<array<string,mixed>> */
    private function speakingCriteria(): array
    {
        return [
            $this->criterion('grammar', 'Grammar', 'Ngữ pháp', [
                '10' => 'Sử dụng đa dạng dạng ngữ pháp linh hoạt và chính xác khi nói.',
                '8' => 'Sử dụng nhiều cấu trúc phù hợp, chỉ có lỗi nhỏ.',
                '6' => 'Dùng cấu trúc đơn giản và một số cấu trúc phức tạp; lỗi khá rõ nhưng giao tiếp vẫn tiếp tục được.',
                '4' => 'Cấu trúc hạn chế và mắc lỗi thường xuyên.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ], [
                'type' => 'structure_count',
                'band_thresholds' => [0 => 5, 1 => 6, 3 => 7, 5 => 8, 6 => 9, 7 => 10],
                'accuracy_factor' => 5,
                'max_accuracy' => ['0-2' => 7, '3-4' => 9, '5+' => 10],
            ], 0.20),
            $this->criterion('vocabulary', 'Vocabulary', 'Từ vựng', [
                '10' => 'Sử dụng vốn từ rộng, chính xác và tự nhiên cho nhiệm vụ nói.',
                '8' => 'Sử dụng từ vựng đa dạng, lựa chọn từ nhìn chung phù hợp.',
                '6' => 'Có đủ từ để giao tiếp nhưng còn lặp từ hoặc đôi lúc thiếu chính xác.',
                '4' => 'Từ vựng cơ bản và thường phải tìm từ khi nói.',
                '0' => 'Không có từ vựng đủ điều kiện đánh giá.',
            ], [
                'base' => 3,
                'cap' => 10,
                'unique_thresholds' => [
                    ['threshold' => 0.45, 'bonus' => 1],
                    ['threshold' => 0.55, 'bonus' => 2],
                    ['threshold' => 0.65, 'bonus' => 3],
                ],
                'length_thresholds' => [
                    ['threshold' => 4.5, 'bonus' => 1],
                    ['threshold' => 5.5, 'bonus' => 2],
                ],
                'readability_thresholds' => [
                    ['threshold' => 8, 'bonus' => 1],
                    ['threshold' => 10, 'bonus' => 2],
                ],
                'complex_thresholds' => [
                    ['threshold' => 2, 'bonus' => 1],
                    ['threshold' => 5, 'bonus' => 2],
                ],
            ], 0.20),
            $this->criterion('fluency', 'Fluency', 'Độ trôi chảy', [
                '10' => 'Nói được đoạn dài với nhịp độ tự nhiên và rất ít ngập ngừng.',
                '8' => 'Duy trì được mạch nói, chỉ đôi lúc ngập ngừng.',
                '6' => 'Có thể tiếp tục nói nhưng các khoảng dừng và việc diễn đạt lại còn khá rõ.',
                '4' => 'Bài nói rời rạc, thường xuyên ngập ngừng.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ], [
                'base' => 3,
                'cap' => 10,
                'wpm_thresholds' => [
                    ['threshold' => 60, 'bonus' => 1],
                    ['threshold' => 90, 'bonus' => 2],
                    ['threshold' => 120, 'bonus' => 3],
                    ['threshold' => 150, 'bonus' => 4],
                ],
            ], 0.20),
            $this->criterion('discourse_management', 'Discourse Management', 'Tổ chức ý và phát triển nội dung', [
                '10' => 'Phát triển ý phù hợp một cách mạch lạc, có tổ chức rõ và dẫn chứng/hỗ trợ tốt.',
                '8' => 'Phát triển ý phù hợp với liên kết và hỗ trợ nhìn chung rõ ràng.',
                '6' => 'Trả lời đúng hướng nhưng phát triển ý hoặc liên kết còn hạn chế.',
                '4' => 'Câu trả lời ngắn, liên kết yếu hoặc chỉ liên quan một phần.',
                '0' => 'Không có câu trả lời đủ điều kiện chấm.',
            ], [
                'base' => 1,
                'linking_factor' => 0.5,
                'linking_cap' => 3,
                'variety_thresholds' => [
                    ['threshold' => 4, 'bonus' => 1],
                    ['threshold' => 6, 'bonus' => 2],
                ],
            ], 0.20),
            $this->criterion('pronunciation', 'Pronunciation', 'Phát âm', [
                '10' => 'Phát âm rõ và tự nhiên, trọng âm và ngữ điệu hiệu quả.',
                '8' => 'Phát âm rõ; lỗi nhỏ hiếm khi ảnh hưởng đến khả năng hiểu.',
                '6' => 'Nhìn chung vẫn hiểu được dù lỗi phát âm khá rõ.',
                '4' => 'Lỗi phát âm thường khiến người nghe khó hiểu.',
                '0' => 'Không có phần nói đủ điều kiện chấm.',
            ], [
                'type' => 'azure_scored',
            ], 0.20),
        ];
    }

    /** @param array<string,string> $descriptors */
    private function criterion(string $key, string $name, string $nameVi, array $descriptors, array $params, float $weight): array
    {
        return [
            'key' => $key,
            'name' => $name,
            'name_vi' => $nameVi,
            'max_score' => 10,
            'weight' => $weight,
            'band_descriptors' => $descriptors,
            'params' => $params,
        ];
    }
}
