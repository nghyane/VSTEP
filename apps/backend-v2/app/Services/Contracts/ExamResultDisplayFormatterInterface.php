<?php

declare(strict_types=1);

namespace App\Services\Contracts;

interface ExamResultDisplayFormatterInterface
{
    public function scoreOnTenLabel(float $score): string;

    public function statusLabel(string $status): string;

    public function mcqAnswerStatus(bool $answered, bool $isCorrect): string;

    public function mcqAnswerStatusLabel(string $status): string;

    public function mcqAnswerTone(string $status): ?string;

    public function mcqOptionLabel(int $index): string;
}
