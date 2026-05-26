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
        if (GradingRubric::where('skill', 'writing')->where('version', 4)->exists()) {
            return;
        }

        // Deactivate old versions
        GradingRubric::where('skill', 'writing')->where('is_active', true)->update(['is_active' => false]);

        GradingRubric::create([
            'skill' => 'writing',
            'version' => 4,
            'name' => 'VSTEP Writing Rubric v4',
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
        if (GradingRubric::where('skill', 'speaking')->where('version', 2)->exists()) {
            return;
        }

        GradingRubric::create([
            'skill' => 'speaking',
            'version' => 2,
            'name' => 'VSTEP Speaking Rubric v2',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'Speaking assessment criteria VSTEP B1-C1 (scale 0-10).',
            'criteria' => $this->speakingCriteria(),
            'scoring_formula' => 'mean_rounded_half',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);
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
                'coverage_multiplier' => 7,
                'position_bonus' => 1,
                'irrelevant_penalty' => 2,
                'default_points_required' => 3,
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
                'cap' => 8,
                'unique_thresholds' => [
                    ['threshold' => 0.45, 'bonus' => 1],
                    ['threshold' => 0.55, 'bonus' => 2],
                    ['threshold' => 0.65, 'bonus' => 3],
                ],
                'length_thresholds' => [
                    ['threshold' => 4.5, 'bonus' => 1],
                    ['threshold' => 5.5, 'bonus' => 2],
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

    /** @return list<array<string,mixed>> */
    private function speakingCriteria(): array
    {
        return [
            [
                'key' => 'grammar',
                'name' => 'Grammar',
                'name_vi' => 'Ngữ pháp',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Uses flexibly and accurately a wide range of grammatical forms and hardly makes mistakes.',
                    '9' => 'Uses flexibly and accurately a wide range of grammatical structures; occasional non-systematic errors may occur.',
                    '8' => 'Uses flexibly and accurately simple structures and a range of complex structures; non-systematic errors may occur with instances of self-correction.',
                    '7' => 'Uses flexibly and accurately simple structures and shows a good control of complex structures; non-systematic errors sometimes occur but do not lead to misunderstanding.',
                    '6' => 'Uses relatively accurately simple structures and shows some control of some complex structures; non-systematic errors occur but do not lead to misunderstanding.',
                    '5' => 'Uses relatively accurately frequently used simple structures; some errors occur but he or she can make himself easily understood; shows some attempts to use complex sentences but makes many errors.',
                    '4' => 'Uses relatively accurately frequently used simple structures; some errors occur but he or she can make himself or herself easily understood.',
                    '3' => 'Uses some simple structures correctly but still systematically makes basic mistakes; however he or she can manage to make himself or herself understood.',
                    '2' => 'Shows only limited control of a few simple grammatical structures and sentence patterns in a learned repertoire.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'vocabulary',
                'name' => 'Vocabulary',
                'name_vi' => 'Từ vựng',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Has a good command of broad vocabulary, including less common words, idiomatic expressions and collocations; possibly searches for other expressions and/or avoidance strategies with few insignificant pauses; makes almost no minor slips but there are no significant lexical errors.',
                    '9' => 'Has a good command of broad vocabulary, including less common words, idiomatic expressions and collocations; possibly searches for other expressions and/or avoidance strategies despite some pauses; occasionally makes minor slips but there are no significant lexical errors.',
                    '8' => 'Uses a wide range of vocabulary of most topics and shows great efforts of avoiding lexical repetition for unfamiliar topics; attempts to use a few less common words and idiomatic expressions; has high lexical accuracy despite occasional confusion and incorrect word choices.',
                    '7' => 'Uses a wide range of vocabulary of most topics and shows some efforts of avoiding lexical repetition for unfamiliar topics; has generally high lexical accuracy despite some confusion and incorrect word choices.',
                    '6' => 'Uses a range of vocabulary of most topics but occasionally shows efforts to avoid lexical repetition for unfamiliar topics; has relatively high lexical accuracy (incorrect word choice and wrong word forms are found).',
                    '5' => 'Uses a range of vocabulary of familiar topics and occasionally uses them repetitively; has some difficulty with unfamiliar topics and makes some lexical errors.',
                    '4' => 'Uses sufficient vocabulary of familiar topics and at times uses them repeatedly; has some difficulty with unfamiliar topics and makes many lexical errors.',
                    '3' => 'Uses appropriate vocabulary and can control a narrow repertoire dealing with familiar situations.',
                    '2' => 'Only uses a basic vocabulary repertoire of isolated words and phrases related to particular concrete topics.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'pronunciation',
                'name' => 'Pronunciation',
                'name_vi' => 'Phát âm',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Is intelligible with individual sounds clearly articulated, sentence and word stress accurately placed; has appropriate intonation; places sentence stress flexibly and correctly to express different meanings.',
                    '9' => 'Is intelligible and has acquired a very clear and natural pronunciation; clearly articulates individual sounds; generally places word and sentence stress; shows efforts with intonation.',
                    '8' => 'Is intelligible and has acquired a quite clear and natural pronunciation; generally clearly articulates individual sounds; generally places stress and shows efforts with sentence stress despite rather low accuracy; shows some efforts with intonation.',
                    '7' => 'Is intelligible and has acquired a little clear and natural pronunciation; generally clearly articulates individual sounds; generally places word stress but does not show efforts to sentence stress; shows few efforts with intonation.',
                    '6' => 'Is mostly intelligible and has acquired a clear pronunciation; makes occasional errors with individual sounds; shows efforts in word stress despite some mispronunciation.',
                    '5' => 'Is mostly intelligible and has acquired a quite clear pronunciation; makes some errors with individual sounds; shows some efforts in word stress despite frequent mispronunciation.',
                    '4' => 'Is mostly intelligible; can articulate simple words and phrases but conversational partners will need to ask for repetition from time to time.',
                    '3' => 'Can articulate a very limited repertoire of learned words and phrases with limited accuracy.',
                    '2' => 'Is often unintelligible.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'fluency',
                'name' => 'Fluency',
                'name_vi' => 'Độ trôi chảy',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Frequently produces extended stretches of language with very little hesitation and maintains an easy, fluent and natural flow with little repetition or error correction; uses the pauses (if any) to search for appropriate ideas for difficult concepts.',
                    '9' => 'Frequently produces extended stretches of language with little hesitation and maintains an easy, fluent and natural flow with occasional repetition or error correction; uses the pauses (if any) to search for appropriate ideas for difficult topics.',
                    '8' => 'Deals with familiar and unfamiliar topics with ease, remarkable fluency and a fairly even tempo; hesitation may occur for grammatical and lexical planning but is rarely noticeable; produces extended stretches of language with rare repetition and self-correction.',
                    '7' => 'Deals with familiar and unfamiliar topics with ease, remarkable fluency and a fairly even tempo; hesitation may occur for grammatical and lexical planning but are occasionally noticeable; produces extended stretches of language with occasional repetition and self-correction.',
                    '6' => 'Deals with familiar and unfamiliar topics with relative ease; hesitation may occur for grammatical and lexical planning but not too noticeable; produces extended stretches of language but shows some evidence of error correction.',
                    '5' => 'Keeps speaking comprehensively on familiar and unfamiliar topics despite some hesitations for grammatical and lexical planning; produces extended responses that shows clear evidence of error corrections.',
                    '4' => 'Keeps speaking comprehensively on familiar topics and shows some attempts to express complex ideas despite evident hesitations for grammatical and lexical planning; produces extended responses using simple structures.',
                    '3' => 'Can construct words and phrases with noticeable hesitation, frequent false starts and repetition.',
                    '2' => 'Can only manage very short isolated words and phrases, mainly learned utterances, with much pausing.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
            [
                'key' => 'discourse_management',
                'name' => 'Discourse Management',
                'name_vi' => 'Kiểm soát diễn ngôn',
                'max_score' => 10,
                'weight' => 1.0,
                'band_descriptors' => [
                    '10' => 'Coherently and easily develops ideas with elaborative details and some examples; can round off with an appropriate conclusion; produces clear and smoothly flowing, well-structured speech, showing efficiently and controlled use of organizational patterns, connectors and cohesive devices.',
                    '9' => 'Generally coherently develops ideas with elaborated details and examples and can round off with an appropriate conclusion; produces clear and smoothly flowing, well-structured speech, showing rather efficiently and controlled use of organizational patterns, connectors and cohesive devices.',
                    '8' => 'Relevantly develops ideas with ease, elaborating on ideas with appropriate details and examples; uses a variety of linking words and efficiently to mark clearly the relationships between ideas.',
                    '7' => 'Relevantly develops ideas with relative ease, elaborating on ideas with many appropriate details and examples; uses a variety of linking words to mark clearly the relationships between ideas.',
                    '6' => 'Relevantly develops ideas with relative ease, elaborating on ideas with some appropriate details and examples; uses more complex connectors to link his or her utterances but fails to mark clearly the relationships between ideas.',
                    '5' => 'Relevantly responds to questions and can develop ideas in a simple list of points; even though some attempts of idea elaboration (details and examples) are evident, they are either vaguely or repetitively expressed; flexibly links ideas with some simple connectors.',
                    '4' => 'Relevantly responds to questions and can develop ideas in a simple list of points; shows some attempts at idea elaboration; links ideas with some simple connectors but repetition is still common.',
                    '3' => 'Expresses ideas with limited language and cannot develop ideas without relying heavily on the repetition of the prompts; links groups of words with simple connectors like and, but, because.',
                    '2' => 'Hardly expresses or develops his or her ideas; only links words or groups of words with very basic connectors like and, or, then.',
                    '1' => 'Performance does not satisfy band 2 descriptors.',
                    '0' => 'Không có thông tin.',
                ],
            ],
        ];
    }
}
