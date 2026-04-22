<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Models\ExamSession;

/**
 * Typed result object cho exam submission.
 * Service layer không phụ thuộc HTTP — dùng DTO thay vì array.
 */
final readonly class ExamSubmitResult
{
    /**
     * @param  int  $mcqScore  Số câu MCQ đúng
     * @param  int  $mcqTotal  Tổng số câu MCQ đã trả lời
     * @param  list<array{item_ref_type:string,item_ref_id:string,selected_index:int,correct_index:int,is_correct:bool}>  $mcqPerItemResults
     * @param  list<array{submission_id:string,job_id:string,status:string}>  $writingJobs
     * @param  list<array{submission_id:string,job_id:string,status:string}>  $speakingJobs
     */
    public function __construct(
        public ExamSession $session,
        public int $mcqScore,
        public int $mcqTotal,
        public array $mcqPerItemResults,
        public array $writingJobs,
        public array $speakingJobs,
    ) {}
}
