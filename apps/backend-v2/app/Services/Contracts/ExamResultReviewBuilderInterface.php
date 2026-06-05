<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;

interface ExamResultReviewBuilderInterface
{
    /**
     * @param  array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}  $scores
     * @param  list<array{item_ref_id: string, selected_index: int|null, is_correct: bool}>  $mcqDetail
     * @param  list<array<string, mixed>>  $writingFeedback
     * @param  list<array<string, mixed>>  $speakingFeedback
     * @return array{skills: list<array<string, mixed>>, sections: list<array<string, mixed>>}
     */
    public function build(
        ExamSession $session,
        array $scores,
        array $mcqDetail,
        array $writingFeedback,
        array $speakingFeedback,
    ): array;
}
