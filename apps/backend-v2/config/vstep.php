<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | VSTEP Exam Version Validation Rules
    |--------------------------------------------------------------------------
    |
    | Official exam structure from Bộ GD&ĐT.
    | Used by ExamVersion::validate() and ContentSeeder.
    |
    */

    'listening' => [
        'duration_minutes' => 40,
        'options_per_question' => 4,
        'parts' => [
            1 => ['sections' => 8, 'items_per_section' => 1],
            2 => ['sections' => 3, 'items_per_section' => 4],
            3 => ['sections' => 3, 'items_per_section' => 5],
        ],
        'total_questions' => 35,
    ],

    'reading' => [
        'duration_minutes' => 60,
        'passages' => 4,
        'required_parts' => [1, 2, 3, 4],
        'items_per_passage' => 10,
        'total_questions' => 40,
        'options_per_question' => 4,
        'total_words' => ['min' => 1900, 'max' => 2500],
    ],

    'writing' => [
        'duration_minutes' => 60,
        'tasks' => 2,
        'required_types' => ['letter', 'essay'],
        'parts' => [
            1 => ['task_type' => 'letter', 'duration_minutes' => 20, 'min_words' => 120],
            2 => ['task_type' => 'essay', 'duration_minutes' => 40, 'min_words' => 250],
        ],
    ],

    'speaking' => [
        'parts' => 3,
        'duration_minutes' => 12,
        'part_rules' => [
            1 => [
                'type' => 'social',
                'duration_minutes' => 3,
                'speaking_seconds' => 180,
                'topics' => 2,
                'questions_total_min' => 3,
                'questions_total_max' => 6,
            ],
            2 => [
                'type' => 'solution',
                'duration_minutes' => 4,
                'speaking_seconds' => 240,
                'solutions' => 3,
            ],
            3 => [
                'type' => 'topic',
                'duration_minutes' => 5,
                'speaking_seconds' => 300,
                'follow_up_questions_min' => 3,
            ],
        ],
    ],

];
