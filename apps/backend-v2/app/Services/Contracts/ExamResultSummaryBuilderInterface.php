<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;

interface ExamResultSummaryBuilderInterface
{
    /**
     * @param  array{score: int, total: int, answered: int, wrong: int, unanswered: int, score_on_10: float}  $mcqSummary
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array<string, mixed>>  $performanceRows
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     * @return array<string, mixed>
     */
    public function build(
        ExamSession $session,
        array $mcqSummary,
        array $scores,
        ?float $overallBand,
        string $vstepLevel,
        array $performanceRows,
        array $writingFeedback,
        array $speakingFeedback,
    ): array;
}
