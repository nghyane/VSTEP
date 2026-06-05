<?php

declare(strict_types=1);

return [
    'llm' => [
        'base_url' => env('LLM_BASE_URL', 'http://localhost:11434'),
        'model' => env('LLM_MODEL', 'gemini-3-flash-preview'),
        'api_key' => env('LLM_API_KEY', ''),
    ],

    'speaking' => [
        'descriptor_bands' => [
            0 => 2.0,
            1 => 3.5,
            2 => 5.0,
            3 => 6.0,
            4 => 7.0,
            5 => 8.0,
        ],
        'criterion_caps' => [
            'speaking_part_2' => [
                'grammar' => [
                    'low_syntax_cap' => ['syntax_count_lte' => 1, 'cap' => 6.5],
                ],
                'vocabulary' => [
                    'low_advanced_topic_cap' => [
                        'advanced_ratio_lt' => 0.1,
                        'topic_lexis_lt' => 2,
                        'cap' => 6.5,
                    ],
                ],
            ],
        ],
        'descriptors' => [
            'speaking_part_1' => [
                'answers_with_extension' => [
                    ['feature' => 'word_count', 'operator' => '>=', 'value' => 45],
                    ['feature' => 'short_turn_ratio', 'operator' => '<=', 'value' => 0.5],
                ],
                'uses_familiar_topic_lexis' => [
                    ['feature' => 'topic_lexis', 'operator' => '>=', 'value' => 2],
                ],
                'maintains_basic_coherence' => [
                    'any' => [
                        [['feature' => 'discourse_marker', 'operator' => '>=', 'value' => 1]],
                        [['feature' => 'development_count', 'operator' => '>=', 'value' => 1]],
                    ],
                ],
                'limited_repetition' => [
                    ['feature' => 'repetition_ratio', 'operator' => '<=', 'value' => 0.35],
                ],
                'natural_spoken_control' => [
                    ['feature' => 'hesitation', 'operator' => '<=', 'value' => 4],
                ],
            ],
            'speaking_part_2' => [
                'sustains_long_turn' => [
                    'any' => [
                        [['feature' => 'word_count', 'operator' => '>=', 'value' => 85]],
                        [['feature' => 'long_turn_count', 'operator' => '>=', 'value' => 1]],
                    ],
                ],
                'develops_main_ideas' => [
                    ['feature' => 'development_count', 'operator' => '>=', 'value' => 2],
                ],
                'gives_reasons_or_examples' => [
                    ['feature' => 'reason_example_count', 'operator' => '>=', 'value' => 2],
                ],
                'uses_sequencing_or_cohesion' => [
                    ['feature' => 'discourse_marker', 'operator' => '>=', 'value' => 2],
                ],
                'compares_or_selects_options' => [
                    'any' => [
                        [['feature' => 'comparison_count', 'operator' => '>=', 'value' => 1]],
                        [['feature' => 'preference_count', 'operator' => '>=', 'value' => 1]],
                    ],
                ],
                'has_closing_or_preference' => [
                    'any' => [
                        [['feature' => 'conclusion_count', 'operator' => '>=', 'value' => 1]],
                        [['feature' => 'preference_count', 'operator' => '>=', 'value' => 1]],
                    ],
                ],
                'limited_repetition' => [
                    ['feature' => 'repetition_ratio', 'operator' => '<=', 'value' => 0.3],
                ],
            ],
            'speaking_part_3' => [
                'states_position' => [
                    ['feature' => 'position_count', 'operator' => '>=', 'value' => 1],
                ],
                'compares_or_evaluates' => [
                    ['feature' => 'comparison_count', 'operator' => '>=', 'value' => 1],
                ],
                'explains_causes_or_effects' => [
                    'any' => [
                        [['feature' => 'cause_effect_count', 'operator' => '>=', 'value' => 1]],
                        [['feature' => 'reason_example_count', 'operator' => '>=', 'value' => 2]],
                    ],
                ],
                'uses_abstract_or_topic_lexis' => [
                    ['feature' => 'topic_lexis', 'operator' => '>=', 'value' => 2],
                ],
                'organizes_argument' => [
                    ['feature' => 'discourse_marker', 'operator' => '>=', 'value' => 3],
                ],
            ],
        ],
    ],
];
