<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\GradingRubric;
use App\Models\ScoringPolicy;
use Illuminate\Database\Seeder;

/**
 * Seed VSTEP grading rubrics + scoring policies.
 *
 * Source: Thông tư 23/2017/TT-BGDĐT, Phụ lục III.
 * Band descriptors adapted from official VSTEP examiner guidelines (B1-C1).
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
        if (GradingRubric::where('skill', 'writing')->where('version', 1)->exists()) {
            return;
        }

        $rubric = GradingRubric::create([
            'skill' => 'writing',
            'version' => 1,
            'name' => 'VSTEP Writing Rubric v1',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'Band descriptors theo khung VSTEP B1-C1 chính thức.',
            'criteria' => $this->writingCriteria(),
            'scoring_formula' => 'linear_mean_10',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);

        ScoringPolicy::create([
            'rubric_id' => $rubric->id,
            'version' => 1,
            'name' => 'VSTEP Writing Caps v1',
            'rules' => $this->writingPolicyRules(),
            'is_active' => true,
        ]);
    }

    private function seedSpeakingRubric(): void
    {
        if (GradingRubric::where('skill', 'speaking')->where('version', 1)->exists()) {
            return;
        }

        $rubric = GradingRubric::create([
            'skill' => 'speaking',
            'version' => 1,
            'name' => 'VSTEP Speaking Rubric v1',
            'source_reference' => 'Thông tư 23/2017/TT-BGDĐT, Phụ lục III. '
                .'Speaking assessment criteria VSTEP B1-C1.',
            'criteria' => $this->speakingCriteria(),
            'scoring_formula' => 'linear_mean_10',
            'is_active' => true,
            'effective_from' => '2017-09-01',
        ]);

        ScoringPolicy::create([
            'rubric_id' => $rubric->id,
            'version' => 1,
            'name' => 'VSTEP Speaking Caps v1',
            'rules' => $this->speakingPolicyRules(),
            'is_active' => true,
        ]);
    }

    /** @return list<array<string,mixed>> */
    private function writingCriteria(): array
    {
        return [
            [
                'key' => 'task_achievement',
                'name' => 'Task Achievement',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Fully addresses all parts of the task with relevant, extended ideas. Appropriate tone and format throughout.',
                    '3.0' => 'Addresses all parts of the task. Some parts may be more fully covered than others. Generally appropriate tone.',
                    '2.0' => 'Partially addresses the task. Format may be inappropriate in places. Limited development of ideas.',
                    '1.0' => 'Barely relates to the task. Very limited content. May be largely off-topic.',
                ],
            ],
            [
                'key' => 'coherence',
                'name' => 'Coherence & Cohesion',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Logically organized with clear progression. Uses a range of cohesive devices appropriately. Clear paragraphing.',
                    '3.0' => 'Generally well-organized. Uses cohesive devices but may be mechanical. Paragraphing is logical.',
                    '2.0' => 'Limited organization. Inadequate use of cohesive devices. May lack paragraphing or use it illogically.',
                    '1.0' => 'No apparent organization. Very little use of cohesive devices. No paragraphing.',
                ],
            ],
            [
                'key' => 'lexical',
                'name' => 'Lexical Resource',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Wide range of vocabulary used naturally and precisely. Rare errors in word choice or spelling.',
                    '3.0' => 'Sufficient range for the task. Some errors in word choice but meaning is clear.',
                    '2.0' => 'Limited range, repetitive. Errors in word choice may cause difficulty for the reader.',
                    '1.0' => 'Extremely limited vocabulary. Frequent errors severely impede communication.',
                ],
            ],
            [
                'key' => 'grammar',
                'name' => 'Grammatical Range & Accuracy',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Wide range of structures with full flexibility and accuracy. Rare minor errors.',
                    '3.0' => 'Good range of structures. Errors occur but do not impede communication.',
                    '2.0' => 'Limited range of structures. Frequent errors that may impede communication.',
                    '1.0' => 'Very limited control. Errors dominate and severely distort meaning.',
                ],
            ],
        ];
    }

    /** @return list<array<string,mixed>> */
    private function speakingCriteria(): array
    {
        return [
            [
                'key' => 'fluency',
                'name' => 'Fluency & Coherence',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Speaks fluently with only rare hesitation. Develops topics coherently and appropriately.',
                    '3.0' => 'Speaks with some hesitation but maintains flow. Generally coherent with some lapses.',
                    '2.0' => 'Noticeable pauses and hesitation. Limited ability to link ideas. May be repetitive.',
                    '1.0' => 'Long pauses. Very limited ability to produce connected speech.',
                ],
            ],
            [
                'key' => 'pronunciation',
                'name' => 'Pronunciation',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Clear and natural pronunciation. Stress and intonation aid communication.',
                    '3.0' => 'Generally clear. Some mispronunciations but rarely cause misunderstanding.',
                    '2.0' => 'Pronunciation errors are frequent and may cause listener strain.',
                    '1.0' => 'Very difficult to understand. Pronunciation severely impedes communication.',
                ],
            ],
            [
                'key' => 'content',
                'name' => 'Content & Task Fulfillment',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Fully addresses the task with relevant, extended responses. Ideas well-developed.',
                    '3.0' => 'Addresses the task adequately. Some ideas may lack development.',
                    '2.0' => 'Partially addresses the task. Responses may be brief or tangential.',
                    '1.0' => 'Barely addresses the task. Extremely limited or irrelevant content.',
                ],
            ],
            [
                'key' => 'vocab',
                'name' => 'Lexical Resource',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Uses a wide range of vocabulary flexibly to discuss topics at length.',
                    '3.0' => 'Sufficient vocabulary for the task. Some paraphrasing for gaps.',
                    '2.0' => 'Limited vocabulary. Frequent repetition and difficulty expressing ideas.',
                    '1.0' => 'Extremely limited. Cannot convey basic meaning.',
                ],
            ],
            [
                'key' => 'grammar',
                'name' => 'Grammatical Range & Accuracy',
                'max_score' => 4.0,
                'weight' => 1.0,
                'band_descriptors' => [
                    '4.0' => 'Uses a range of complex structures with flexibility. Errors are rare.',
                    '3.0' => 'Uses a mix of simple and complex structures. Some errors but meaning clear.',
                    '2.0' => 'Mostly simple structures. Frequent errors may affect clarity.',
                    '1.0' => 'Cannot produce basic sentence forms accurately.',
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private function writingPolicyRules(): array
    {
        return [
            'caps' => [
                'grammar' => [
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 1.0, 'max' => 1.5],
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 0.5, 'max' => 2.5],
                    ['metric' => 'errors_per_sentence', 'op' => '>', 'value' => 0.2, 'max' => 3.0],
                    ['metric' => 'avg_sentence_length', 'op' => '<', 'value' => 6, 'max' => 2.0],
                ],
                'task_achievement' => [
                    ['metric' => 'word_count', 'op' => '<', 'value' => 80, 'max' => 2.0],
                    ['metric' => 'word_count', 'op' => '<', 'value' => 100, 'max' => 2.5],
                ],
                'lexical' => [
                    ['metric' => 'unique_ratio', 'op' => '<', 'value' => 0.4, 'max' => 2.0],
                    ['metric' => 'unique_ratio', 'op' => '<', 'value' => 0.5, 'max' => 2.5],
                ],
                'coherence' => [
                    ['metric' => 'paragraph_count', 'op' => '<', 'value' => 2, 'max' => 2.0],
                    [
                        'all' => [
                            ['metric' => 'linking_word_count', 'op' => '==', 'value' => 0],
                            ['metric' => 'sentence_count', 'op' => '>', 'value' => 3],
                        ],
                        'max' => 2.5,
                    ],
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private function speakingPolicyRules(): array
    {
        return [
            'caps' => [],
        ];
    }
}
