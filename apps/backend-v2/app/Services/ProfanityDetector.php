<?php

declare(strict_types=1);

namespace App\Services;

final class ProfanityDetector
{
    /** @var list<string> */
    private const WORDS = [
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn',
        'crap', 'dick', 'piss', 'slut', 'whore', 'moron',
        'idiot', 'stupid', 'dumb', 'suck', 'hell',
    ];

    /** @return array{found: bool, words: list<string>, count: int} */
    public function detect(string $text): array
    {
        $lower = mb_strtolower($text);
        $words = explode(' ', preg_replace('/[^a-zA-Z\s]+/', ' ', $lower) ?? '');
        $found = array_values(array_intersect($words, self::WORDS));
        $unique = array_values(array_unique($found));

        return [
            'found' => $unique !== [],
            'words' => $unique,
            'count' => count($found),
        ];
    }

    public function isEnabled(): bool
    {
        return true;
    }
}
