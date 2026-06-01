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
                '10' => 'Addresses the task fully with a clear purpose/position and well-developed relevant support.',
                '8' => 'Addresses all main requirements; ideas are generally developed and relevant.',
                '6' => 'Addresses the task but some parts are underdeveloped or only partly supported.',
                '4' => 'Addresses only part of the task; development is limited or repetitive.',
                '0' => 'No assessable response, or the response is off-topic.',
            ], [
                'coverage_multiplier' => 7,
                'task1_multiplier' => 7,
                'position_bonus' => 0.5,
                'irrelevant_penalty' => 2,
                'default_points_required' => 3,
                'word_minimum_task1' => 120,
                'word_minimum_task2' => 250,
                'depth_minimum' => 0.25,
                'short_essay_caps' => [
                    ['max_words' => 80, 'cap' => 4],
                    ['max_words' => 120, 'cap' => 6],
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
                '10' => 'Ideas are logically organized with effective paragraphing and cohesive devices.',
                '8' => 'Organization is clear; paragraphing and linking are generally effective.',
                '6' => 'Overall organization is understandable, though links or paragraphing may be mechanical.',
                '4' => 'Organization is weak; ideas may be listed or difficult to follow.',
                '0' => 'No assessable organization.',
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
                '10' => 'Uses a wide range of grammatical structures flexibly and accurately.',
                '8' => 'Uses a good range of simple and complex structures with only occasional errors.',
                '6' => 'Uses a mix of simple and some complex structures; errors are noticeable but meaning is clear.',
                '4' => 'Uses mostly simple structures with frequent errors.',
                '0' => 'No assessable grammar.',
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
                '10' => 'Uses a wide, precise lexical range naturally for the topic.',
                '8' => 'Uses varied topic vocabulary with generally appropriate word choice.',
                '6' => 'Uses sufficient vocabulary for the task, with some repetition or imprecision.',
                '4' => 'Uses basic, repetitive vocabulary; word-choice errors may affect clarity.',
                '0' => 'No assessable vocabulary.',
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
                '10' => 'Uses a wide range of grammatical forms flexibly and accurately.',
                '8' => 'Uses a good range of structures with minor errors.',
                '6' => 'Uses simple and some complex forms; errors are noticeable but communication continues.',
                '4' => 'Uses limited structures with frequent errors.',
                '0' => 'No assessable speech.',
            ], [
                'type' => 'structure_count',
                'band_thresholds' => [0 => 5, 1 => 6, 3 => 7, 5 => 8, 6 => 9, 7 => 10],
                'accuracy_factor' => 5,
                'max_accuracy' => ['0-2' => 7, '3-4' => 9, '5+' => 10],
            ], 0.20),
            $this->criterion('vocabulary', 'Vocabulary', 'Từ vựng', [
                '10' => 'Uses broad and precise vocabulary naturally for the speaking task.',
                '8' => 'Uses varied vocabulary with generally appropriate word choice.',
                '6' => 'Uses enough vocabulary to communicate, with repetition or occasional imprecision.',
                '4' => 'Uses basic vocabulary and often searches for words.',
                '0' => 'No assessable vocabulary.',
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
                '10' => 'Produces extended speech with natural pacing and very little hesitation.',
                '8' => 'Maintains speech with only occasional hesitation.',
                '6' => 'Can keep speaking, though pauses and reformulation are noticeable.',
                '4' => 'Speech is fragmented with frequent hesitation.',
                '0' => 'No assessable speech.',
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
                '10' => 'Develops relevant ideas coherently with clear organization and support.',
                '8' => 'Develops relevant ideas with generally clear linking and support.',
                '6' => 'Gives relevant answers but development or linking may be limited.',
                '4' => 'Answers are short, weakly connected, or only partly relevant.',
                '0' => 'No assessable response.',
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
                '10' => 'Pronunciation is clear and natural, with effective stress and intonation.',
                '8' => 'Pronunciation is clear; minor issues rarely affect understanding.',
                '6' => 'Generally understandable, though pronunciation issues are noticeable.',
                '4' => 'Pronunciation issues often make understanding difficult.',
                '0' => 'No assessable speech.',
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
