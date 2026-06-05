<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Services\Contracts\ExamResultDisplayFormatterInterface;

final class ExamResultDisplayFormatter implements ExamResultDisplayFormatterInterface
{
    public function scoreOnTenLabel(float $score): string
    {
        return round($score, 1).'/10';
    }

    public function statusLabel(string $status): string
    {
        return match ($status) {
            ExamResultReadModelStatus::READY => 'Đã có kết quả',
            ExamResultReadModelStatus::PENDING => 'Đang chấm',
            ExamResultReadModelStatus::FAILED => 'Chấm lỗi',
            ExamResultReadModelStatus::PARTIAL => 'Chưa đủ',
            ExamResultReadModelStatus::NOT_SUBMITTED => 'Chưa nộp',
            default => '—',
        };
    }

    public function mcqAnswerStatus(bool $answered, bool $isCorrect): string
    {
        if (! $answered) {
            return 'unanswered';
        }

        return $isCorrect ? 'correct' : 'wrong';
    }

    public function mcqAnswerStatusLabel(string $status): string
    {
        return match ($status) {
            'correct' => 'Đúng',
            'wrong' => 'Sai',
            default => 'Chưa làm',
        };
    }

    public function mcqAnswerTone(string $status): ?string
    {
        return $status === 'unanswered' ? null : $status;
    }

    public function mcqOptionLabel(int $index): string
    {
        return ['A', 'B', 'C', 'D'][$index] ?? '—';
    }
}
