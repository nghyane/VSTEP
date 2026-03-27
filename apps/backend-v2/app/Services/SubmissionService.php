<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\NotificationType;
use App\Enums\Role;
use App\Enums\SubmissionStatus;
use App\Jobs\GradeSubmission;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use App\Support\VstepScoring;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmissionService
{
    public function __construct(
        private readonly ProgressService $progressService,
        private readonly NotificationService $notificationService,
    ) {}

    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        return Submission::query()
            ->when(! $user->role->is(Role::Admin), fn ($q) => $q->whereBelongsTo($user))
            ->when($filters['skill'] ?? null, fn ($q, $v) => $q->where('skill', $v))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function submit(string $userId, Question $question, array $answer): Submission
    {
        if (! $question->is_active) {
            throw ValidationException::withMessages(['question' => ['Question is not active.']]);
        }

        return DB::transaction(function () use ($userId, $question, $answer) {
            $submission = Submission::create([
                'user_id' => $userId,
                'question_id' => $question->id,
                'skill' => $question->skill,
                'answer' => $answer,
                'status' => SubmissionStatus::Pending,
            ]);

            if ($question->skill->isObjective()) {
                $this->autoGrade($submission, $question);
            } else {
                GradeSubmission::dispatch($submission->id);
            }

            return $submission;
        });
    }

    public function grade(Submission $submission, array $data): Submission
    {
        if ($submission->status === SubmissionStatus::Completed) {
            throw ValidationException::withMessages([
                'submission' => ['Submission has already been graded.'],
            ]);
        }

        return DB::transaction(function () use ($submission, $data) {
            $submission->update([
                ...$data,
                'status' => SubmissionStatus::Completed,
                'completed_at' => now(),
            ]);

            $this->progressService->applySubmission($submission);

            $this->notificationService->send(
                $submission->user_id,
                NotificationType::GradingComplete,
                'Bài làm đã được chấm điểm',
                "Bạn đạt {$submission->score}/10 cho bài {$submission->skill->value}.",
                ['submission_id' => $submission->id, 'score' => $submission->score],
            );

            return $submission;
        });
    }

    private function autoGrade(Submission $submission, Question $question): void
    {
        $result = $question->gradeObjective($submission->answer['answers'] ?? []);
        if ($result === null) {
            return;
        }

        $score = VstepScoring::score($result['raw_ratio']);

        $submission->update([
            'status' => SubmissionStatus::Completed,
            'score' => $score,
            'result' => [
                'type' => 'auto',
                'correct_count' => $result['correct'],
                'total_count' => $result['total'],
                'score' => $score,
                'graded_at' => now()->toAtomString(),
            ],
            'completed_at' => now(),
        ]);

        $this->progressService->applySubmission($submission);
    }
}
