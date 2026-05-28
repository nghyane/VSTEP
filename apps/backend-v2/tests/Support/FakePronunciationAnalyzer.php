<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Ai\Contracts\PronunciationAnalyzer;

final class FakePronunciationAnalyzer implements PronunciationAnalyzer
{
    public function analyze(string $original, string $transcript): array
    {
        return [
            'pronunciation' => 'Phát âm tốt',
            'intonation' => 'Ngữ điệu ổn',
            'tip' => 'Tiếp tục luyện tập',
        ];
    }

    public function generateIpa(string $text): ?string
    {
        return 'aɪ piː eɪ';
    }
}
