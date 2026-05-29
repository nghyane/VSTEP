<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Heuristic language detection for VSTEP writing submissions.
 *
 * Single-layer: non-ASCII letter ratio > 20% → likely non-English.
 *
 * Full Vietnamese/Chinese/Arabic text: ratio ≈ 50–100% → rejected.
 * English with occasional accented word (café, naïve): ratio < 3% → passes.
 * English with Vietnamese names (Nguyễn, Trần): ratio < 5% → passes.
 *
 * VSTEP is an English exam — non-English text is rejected
 * before entering the grading pipeline.
 */
final class LanguageDetector
{
    private const NON_ASCII_LETTER_THRESHOLD = 0.20;

    /**
     * Detect if text is English.
     *
     * @return array{is_english: bool, confidence: float, non_ascii_letter_ratio: float}
     */
    public function detect(string $text): array
    {
        $text = trim($text);
        if ($text === '') {
            return $this->result(true, 1.0, 0.0);
        }

        [$total, $nonAscii] = $this->countLetters($text);
        $ratio = $total > 0 ? $nonAscii / $total : 0.0;
        $isEnglish = $ratio <= self::NON_ASCII_LETTER_THRESHOLD;
        $confidence = $isEnglish ? 1.0 - $ratio : $ratio;

        return $this->result($isEnglish, $confidence, $ratio);
    }

    /** @return array{int, int} [total_letters, non_ascii_letters] */
    private function countLetters(string $text): array
    {
        $total = 0;
        $nonAscii = 0;
        $len = mb_strlen($text);

        for ($i = 0; $i < $len; $i++) {
            $char = mb_substr($text, $i, 1);
            $ord = mb_ord($char);
            if ($ord === null || $ord === false) {
                continue;
            }

            if ($this->isLetter($ord)) {
                $total++;
                if ($ord > 127) {
                    $nonAscii++;
                }
            }
        }

        return [$total, $nonAscii];
    }

    private function isLetter(int $ord): bool
    {
        return ($ord >= 0x41 && $ord <= 0x5A)   // A-Z
            || ($ord >= 0x61 && $ord <= 0x7A)   // a-z
            || ($ord >= 0xC0 && $ord <= 0x2AF)  // Latin Extended A/B/IPA
            || ($ord >= 0x1E00 && $ord <= 0x1EFF); // Latin Extended Additional
    }

    /** @return array{is_english: bool, confidence: float, non_ascii_letter_ratio: float} */
    private function result(bool $isEnglish, float $confidence, float $ratio): array
    {
        return [
            'is_english' => $isEnglish,
            'confidence' => round($confidence, 3),
            'non_ascii_letter_ratio' => round($ratio, 3),
        ];
    }
}
