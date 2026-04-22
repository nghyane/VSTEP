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
        'parts' => [
            1 => ['sections' => 8, 'items_per_section' => 1],
            2 => ['sections' => 3, 'items_per_section' => 4],
            3 => ['sections' => 3, 'items_per_section' => 5],
        ],
        'total_questions' => 35,
    ],

    'reading' => [
        'passages' => 4,
        'items_per_passage' => 10,
        'total_questions' => 40,
    ],

    'writing' => [
        'tasks' => 2,
        'required_types' => ['letter', 'essay'],
    ],

    'speaking' => [
        'parts' => 3,
    ],

];
