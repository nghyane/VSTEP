<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;

interface ExamResultMcqBuilderInterface
{
    /** @return list<array<string, mixed>> */
    public function detail(ExamSession $session): array;

    /**
     * @param  list<array{selected_index: int|null, is_correct: bool}>  $mcqDetail
     * @return array{score: int, total: int, answered: int, wrong: int, unanswered: int, score_on_10: float}
     */
    public function summary(array $mcqDetail): array;
}
