<?php

declare(strict_types=1);

namespace App\Services\Admin;

final class ScoringPresetService
{
    /** @return array<string,array<string,mixed>> */
    public static function presets(): array
    {
        return [
            'strict' => self::strict(),
            'standard' => self::standard(),
            'lenient' => self::lenient(),
        ];
    }

    /** @return list<string> */
    public static function labels(): array
    {
        return [
            'strict' => 'Chặt — từ chối sớm, cap thấp',
            'standard' => 'Tiêu chuẩn — cân bằng giữa phát hiện và điểm',
            'lenient' => 'Thoáng — ít từ chối, cap cao',
        ];
    }

    /** @return array<string,mixed> */
    public static function derive(string $preset, int $officialTask1, int $officialTask2, int $coverage): array
    {
        $base = self::presets()[$preset] ?? self::standard();

        return [
            'severity' => $preset,
            'severe_minimum_words_task1' => $base['severe_min_words_task1'] ?? 60,
            'severe_minimum_words_task2' => $base['severe_min_words_task2'] ?? 125,
            'minimum_covered_points' => $coverage,
            'word_minimum_task1' => $officialTask1,
            'word_minimum_task2' => $officialTask2,
            'short_response_caps' => $base['short_response_caps'] ?? [['max_words' => 10, 'cap' => 1], ['max_words' => 30, 'cap' => 2]],
            'task_fulfillment_word_caps' => $base['tf_word_caps'] ?? [['max_words' => 80, 'cap' => 4], ['max_words' => 120, 'cap' => 6]],
            'tf_cap_ratio' => $base['tf_cap_ratio'] ?? 1.3,
        ];
    }

    // ── Presets ──────────────────────────────────────────────────

    /** @return array<string,mixed> */
    private static function strict(): array
    {
        return [
            'severe_min_words_task1' => 80,
            'severe_min_words_task2' => 150,
            'short_response_caps' => [
                ['max_words' => 10, 'cap' => 1],
                ['max_words' => 30, 'cap' => 2],
            ],
            'tf_word_caps' => [
                ['max_words' => 80, 'cap' => 3],
                ['max_words' => 120, 'cap' => 5],
            ],
            'tf_cap_ratio' => 1.2,
        ];
    }

    /** @return array<string,mixed> */
    private static function standard(): array
    {
        return [
            'severe_min_words_task1' => 60,
            'severe_min_words_task2' => 125,
            'short_response_caps' => [
                ['max_words' => 10, 'cap' => 1],
                ['max_words' => 30, 'cap' => 2],
            ],
            'tf_word_caps' => [
                ['max_words' => 80, 'cap' => 4],
                ['max_words' => 120, 'cap' => 6],
            ],
            'tf_cap_ratio' => 1.3,
        ];
    }

    /** @return array<string,mixed> */
    private static function lenient(): array
    {
        return [
            'severe_min_words_task1' => 40,
            'severe_min_words_task2' => 90,
            'short_response_caps' => [
                ['max_words' => 10, 'cap' => 1],
            ],
            'tf_word_caps' => [
                ['max_words' => 80, 'cap' => 5],
            ],
            'tf_cap_ratio' => 1.4,
        ];
    }
}
