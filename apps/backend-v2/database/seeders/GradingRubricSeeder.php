<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradingRubric;
use Illuminate\Database\Seeder;

/**
 * Seed VSTEP grading rubrics + scoring policies.
 *
 * Source: Thông tư 23/2017/TT-BGDĐT, Phụ lục III.
 * Band descriptors from official VSTEP examiner guidelines (B1-C1),
 * scale 0–10 per Bộ GD&ĐT specification.
 *
 * Immutable reference data. Re-running is safe (checks existing version).
 */
class GradingRubricSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedWritingRubric();
        $this->seedSpeakingRubric();
    }

    private function seedWritingRubric(): void
    {
        if (GradingRubric::where('skill', 'writing')->where('version', 5)->exists()) {
            return;
        }

        // Deactivate old versions
        GradingRubric::where('skill', 'writing')->where('is_active', true)->update(['is_active' => false]);

        GradingRubric::create([
            'skill' => 'writing',
            'version' => 5,
            'name' => 'VSTEP Writing Rubric v5',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'v4: band descriptors + quantitative params for deterministic formula.',
            'criteria' => $this->writingCriteriaV4(),
            'scoring_formula' => 'mean_rounded_half',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);
    }

    private function seedSpeakingRubric(): void
    {
        if (GradingRubric::where('skill', 'speaking')->where('version', 4)->exists()) {
            return;
        }

        GradingRubric::where('skill', 'speaking')->where('is_active', true)->update(['is_active' => false]);

        GradingRubric::create([
            'skill' => 'speaking',
            'version' => 4,
            'name' => 'VSTEP Speaking Rubric v4',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'v4: band descriptors + quantitative params for deterministic formula.',
            'criteria' => $this->speakingCriteriaV3(),
            'scoring_formula' => 'mean_rounded_half',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);
    }

    /** @return list<array<string,mixed>> */
    private function speakingCriteriaV3(): array
    {
        return [
            $this->criterionV4('grammar', 'Grammar', 'Ngữ pháp', [
                '10' => 'Uses flexibly and accurately a wide range of grammatical forms and hardly makes mistakes.',
                '0' => 'Không có thông tin.',
            ], [
                'type' => 'structure_count',
                'band_thresholds' => [0 => 5, 1 => 6, 3 => 7, 5 => 8, 6 => 9, 7 => 10],
                'accuracy_factor' => 5,
                'max_accuracy' => ['0-2' => 7, '3-4' => 9, '5+' => 10],
            ]),
            $this->criterionV4('vocabulary', 'Vocabulary', 'Từ vựng', [
                '10' => 'Has a good command of broad vocabulary, including less common words, idiomatic expressions and collocations.',
                '0' => 'Không có thông tin.',
            ], [
                'base' => 3,
                'cap' => 9,
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
            ]),
            $this->criterionV4('fluency', 'Fluency', 'Độ trôi chảy', [
                '10' => 'Frequently produces extended stretches of language with very little hesitation.',
                '0' => 'Không có thông tin.',
            ], [
                'base' => 3,
                'cap' => 10,
                'wpm_thresholds' => [
                    ['threshold' => 60, 'bonus' => 1],
                    ['threshold' => 90, 'bonus' => 2],
                    ['threshold' => 120, 'bonus' => 3],
                    ['threshold' => 150, 'bonus' => 4],
                ],
                'sentence_length_thresholds' => [
                    ['threshold' => 8, 'bonus' => 1],
                    ['threshold' => 12, 'bonus' => 2],
                ],
            ]),
            $this->criterionV4('discourse_management', 'Discourse Management', 'Kiểm soát diễn ngôn', [
                '10' => 'Coherently and easily develops ideas with elaborative details and some examples.',
                '0' => 'Không có thông tin.',
            ], [
                'base' => 1,
                'linking_factor' => 0.5,
                'linking_cap' => 3,
                'variety_thresholds' => [
                    ['threshold' => 4, 'bonus' => 1],
                    ['threshold' => 6, 'bonus' => 2],
                ],
            ]),
            $this->criterionV4('pronunciation', 'Pronunciation', 'Phát âm', [
                '10' => 'Is intelligible with individual sounds clearly articulated, sentence and word stress accurately placed.',
                '0' => 'Không có thông tin.',
            ], [
                'type' => 'azure_scored',
            ]),
        ];
    }

    /** @return list<array<string,mixed>> */
    private function writingCriteriaV4(): array
    {
        return [
            $this->criterionV4('task_fulfillment', 'Task Fulfillment', 'Hoàn thành yêu cầu đề', [
                '10' => 'Thực hiện đầy đủ các yêu cầu của đề. Trình bày rõ ràng quan điểm.',
                '9' => 'Thực hiện vừa đủ các yêu cầu của đề. Có hệ thống ý tưởng liên quan.',
                '8' => 'Thể hiện tất cả các đặc điểm tích cực của Band 7, nhưng không phải tất cả của Band 9.',
                '7' => 'Đáp ứng tất cả yêu cầu. Thể hiện quan điểm rõ ràng.',
                '6' => 'Đáp ứng tất cả yêu cầu nhưng một số phần chưa đầy đủ.',
                '5' => 'Chỉ đáp ứng một phần yêu cầu đề bài.',
                '0' => 'Không viết bài hoặc lạc đề hoàn toàn.',
            ], [
                'coverage_multiplier' => 9,
                'position_bonus' => 1,
                'irrelevant_penalty' => 2,
                'default_points_required' => 3,
                'word_minimum_task1' => 120,
                'word_minimum_task2' => 250,
                '_sources' => [
                    'coverage_multiplier' => '7 = full range (0→10) reserved for 0%→100% coverage. Scaling factor derived from VSTEP rubric: Band 0 "lạc đề", Band 5 "đáp ứng một phần", Band 10 "đầy đủ". Linear interpolation: 100% coverage × 7 + position_bonus(1) ≤ 8 (not 10 — reserves top 2 bands for exceptional quality beyond checklist).',
                    'position_bonus' => '1 band for expressing a clear position/stance. VSTEP descriptors mention "thể hiện quan điểm rõ ràng" at Band 7+. Conservative bonus — position is expected, not exceptional.',
                    'irrelevant_penalty' => '2 bands for off-topic content. Band 0-3 describes completely off-topic/memorized scripts. Strong penalty reflects rubric severity.',
                    'default_points_required' => '3: typical VSTEP Task 2 has 3 requirements (opinion, reasons, examples). Used as fallback when not configured by admin.',
                ],
            ]),
            $this->criterionV4('organization', 'Organization', 'Bố cục bài viết', [
                '10' => 'Sử dụng công cụ liên kết mượt mà. Chia đoạn khéo léo.',
                '0' => 'Không viết bài.',
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
                '_sources' => [
                    'base' => '1: minimum score for any text with structure. VSTEP Band 1-2 describes "không thể hiện ý tưởng" → base=0. Band 3+ requires some organization → base=1.',
                    'para_bonus' => '{1→1, 2→3, 3→4}: VSTEP descriptor "chia đoạn văn một cách khéo léo" (Band 10) vs "thông tin không viết dưới dạng đoạn văn" (Band 5). 2-paragraph = competent (bonus 3), 3+ = well-structured (bonus 4).',
                    'linking_factor' => '0.5: each linking word adds 0.5 band. VSTEP Band 7 requires "sử dụng nhiều loại thiết bị gắn kết". 6 words × 0.5 = 3 bonus (capped). Calibrated from validation essays (avg 4-6 linking words for B2).',
                    'linking_cap' => '3: prevents linking word spam. 6+ words = max bonus. Validation: Bài 10 (best) has 8 linking words → bonus 3 (not 4).',
                    'variety_thresholds' => 'σ > 4 → 1, σ > 6 → 2. Sentence variety (std dev of lengths) indicates intentional rhythm. VSTEP Band 10: "natural flow". σ=4 typical for B1, σ=6 for B2. Calibrated from ULIS-VNU writing samples.',
                    'compact_threshold' => '8 sentences in 1 paragraph = "wall of text". VSTEP Band 5: "các thông tin không viết dưới dạng đoạn văn". Penalty reflects lost organization points.',
                    'compact_penalty' => '1: moderate penalty. Does not zero out the score — content may still be organized within the single paragraph.',
                ],
            ]),
            $this->criterionV4('grammar', 'Grammar', 'Ngữ pháp', [
                '10' => 'Sử dụng lượng lớn cấu trúc (6+ kiểu) tự nhiên, chính xác.',
                '9' => 'Sử dụng lượng lớn cấu trúc (5+ kiểu). Hầu hết không mắc lỗi.',
                '8' => 'Band 7 + thêm 1-2 kiểu nâng cao.',
                '7' => 'Sử dụng đa dạng cấu trúc phức tạp (3-4 kiểu). Ít lỗi.',
                '6' => 'Kết hợp cấu trúc đơn giản và phức tạp (1-2 kiểu).',
                '5' => 'Chỉ cấu trúc đơn giản. Cố gắng phức tạp nhưng sai.',
                '0' => 'Không viết bài.',
            ], [
                'type' => 'structure_count',
                'band_thresholds' => [0 => 5, 1 => 6, 3 => 7, 5 => 8, 6 => 9, 7 => 10],
                'accuracy_factor' => 5,
                'max_accuracy' => ['0-2' => 7, '3-4' => 9, '5+' => 10],
                '_sources' => [
                    'type' => 'structure_count: complex structures detected by SyntaxAnalyzer (10 patterns: conditional, relative_clause, passive_voice, complex_conjunction, participle_phrase, inversion, cleft_sentence, subjunctive, comparative_correlative, causative).',
                    'band_thresholds' => '0→5, 1→6, 3→7, 5→8, 6→9, 7→10. Derived from VSTEP grammar descriptors: Band 5 "chỉ cấu trúc đơn giản" → 0 types. Band 6 "kết hợp đơn giản + phức tạp (1-2 kiểu)" → 1-2 types. Band 7 "đa dạng cấu trúc phức tạp (3-4 kiểu)" → 3-4 types. Band 9 "lượng lớn cấu trúc (5+ kiểu)" → 5+ types.',
                    'accuracy_factor' => '5: penalty multiplier for grammar errors. (errors/sentences) × 5. Calibrated: 1 error per 5 sentences → penalty=1 (minor). 1 error per sentence → penalty=5 (severe). Descriptor Band 7: "hầu hết không mắc lỗi", Band 5: "thường xuyên mắc lỗi".',
                    'max_accuracy' => '0-2 types→7, 3-4→9, 5+→10. Accuracy without range is meaningless. Band 5 with 0 errors ≠ Band 9. Derived from VSTEP: "chỉ cấu trúc đơn giản + không lỗi" is Band 5-6, not Band 9-10. VSTEP explicitly weights RANGE over accuracy.',
                ],
            ]),
            $this->criterionV4('vocabulary', 'Vocabulary', 'Từ vựng', [
                '10' => 'Sử dụng lượng từ vựng lớn, collocations, idioms.',
                '0' => 'Không viết bài.',
            ], [
                'base' => 3,
                'cap' => 9,
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
                '_sources' => [
                    'base' => '3: baseline vocabulary score for any text. VSTEP Band 3-4 describes "từ vựng cơ bản, lặp đi lặp lại". Base=3 allows 1 bonus → Band 4, 2 bonuses → Band 5, which matches descriptors.',
                    'cap' => '8: vocabulary 9-10 requires exceptional range (collocations, idioms, less common words). These cannot be measured by unique_ratio+word_length alone. Cap ensures Band 9-10 requires LLM-level semantic judgment or additional features.',
                    'unique_thresholds' => '0.45→1, 0.55→2, 0.65→3. Unique word ratio indicates lexical diversity. VSTEP: "lượng từ vựng hạn chế" (repetitive) vs "lượng từ vựng lớn". Ratio 0.45 typical for 120-word B1 essay, 0.55 for 200-word B2 essay, 0.65 for rich vocabulary. Calibrated from validation essays.',
                    'length_thresholds' => '4.5→1, 5.5→2. Average word length correlates with vocabulary sophistication (longer words = more academic/specific vocabulary). Length 4.5 typical for B1 (common words), 5.5 for B2 (topic-specific vocabulary).',
                ],
            ]),
        ];
    }

    /** @param array<string,string> $descriptors */
    private function criterionV4(string $key, string $name, string $nameVi, array $descriptors, array $params): array
    {
        return [
            'key' => $key,
            'name' => $name,
            'name_vi' => $nameVi,
            'max_score' => 10,
            'weight' => 1.0,
            'band_descriptors' => $descriptors,
            'params' => $params,
        ];
    }

    /** @param array<string,string> $descriptors */
    private function criterion(string $key, string $name, string $nameVi, array $descriptors): array
    {
        return [
            'key' => $key,
            'name' => $name,
            'name_vi' => $nameVi,
            'max_score' => 10,
            'weight' => 1.0,
            'band_descriptors' => $descriptors,
        ];
    }
}
