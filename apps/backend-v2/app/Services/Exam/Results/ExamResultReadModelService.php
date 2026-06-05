<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

use App\Models\ExamSession;
use App\Services\Contracts\ExamResultReadModelInterface;
use App\Services\Contracts\ExamResultReviewBuilderInterface;
use App\Services\Contracts\ExamResultSummaryBuilderInterface;

final readonly class ExamResultReadModelService implements ExamResultReadModelInterface
{
    public function __construct(
        private ExamResultSummaryBuilderInterface $summaryBuilder,
        private ExamResultReviewBuilderInterface $reviewBuilder,
    ) {}

    public function build(
        ExamSession $session,
        array $mcqSummary,
        array $scores,
        array $mcqDetail,
        ?float $overallBand,
        string $vstepLevel,
        array $performanceRows,
        array $writingFeedback,
        array $speakingFeedback,
    ): array {
        return [
            'summary' => $this->summaryBuilder->build(
                $session,
                $mcqSummary,
                $overallBand,
                $vstepLevel,
                $performanceRows,
                $writingFeedback,
                $speakingFeedback,
            ),
            'review' => $this->reviewBuilder->build(
                $session,
                $scores,
                $mcqDetail,
                $writingFeedback,
                $speakingFeedback,
            ),
        ];
    }
}
