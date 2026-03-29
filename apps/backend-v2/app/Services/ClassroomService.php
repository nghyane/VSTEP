<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AssignmentSubmissionStatus;
use App\Models\ClassAssignment;
use App\Models\ClassAssignmentSubmission;
use App\Models\ClassFeedback;
use App\Models\ClassMember;
use App\Models\Classroom;
use App\Models\ExamSession;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ClassroomService
{
    public function list(User $user): LengthAwarePaginator
    {
        return Classroom::query()
            ->where(function ($q) use ($user) {
                $q->where('instructor_id', $user->id)
                    ->orWhereHas('members', fn ($q) => $q->where('user_id', $user->id));
            })
            ->withCount('members')
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function show(Classroom $classroom): Classroom
    {
        $classroom->load(['members.user']);
        $classroom->loadCount('members');

        return $classroom;
    }

    public function create(array $data, User $user): Classroom
    {
        return Classroom::create([
            ...$data,
            'instructor_id' => $user->id,
            'invite_code' => $this->generateInviteCode(),
        ]);
    }

    public function update(Classroom $classroom, array $data): Classroom
    {
        $classroom->update($data);

        return $classroom;
    }

    public function delete(Classroom $classroom): void
    {
        $classroom->delete();
    }

    public function rotateCode(Classroom $classroom): Classroom
    {
        $classroom->update(['invite_code' => $this->generateInviteCode()]);

        return $classroom;
    }

    public function join(string $inviteCode, User $user): Classroom
    {
        $classroom = Classroom::where('invite_code', $inviteCode)->first();

        if (! $classroom) {
            throw new NotFoundHttpException('Mã mời không hợp lệ');
        }

        $exists = ClassMember::where('classroom_id', $classroom->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            throw new ConflictHttpException('Bạn đã tham gia lớp này rồi');
        }

        ClassMember::create([
            'classroom_id' => $classroom->id,
            'user_id' => $user->id,
        ]);

        // Create pending submissions for all existing assignments
        $assignments = $classroom->assignments()->pluck('id');
        $rows = $assignments->map(fn ($assignmentId) => [
            'id' => (string) Str::uuid(),
            'assignment_id' => $assignmentId,
            'user_id' => $user->id,
            'status' => AssignmentSubmissionStatus::Pending->value,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if (count($rows) > 0) {
            ClassAssignmentSubmission::insert($rows);
        }

        return $classroom;
    }

    public function leave(Classroom $classroom, User $user): void
    {
        ClassMember::where('classroom_id', $classroom->id)
            ->where('user_id', $user->id)
            ->delete();
    }

    public function removeMember(Classroom $classroom, string $userId): void
    {
        ClassMember::where('classroom_id', $classroom->id)
            ->where('user_id', $userId)
            ->delete();
    }

    public function dashboard(Classroom $classroom): array
    {
        $classroom->loadCount('members');

        return [
            'member_count' => $classroom->members_count,
            'at_risk_count' => 0,
            'at_risk_learners' => [],
            'skill_summary' => (object) [],
        ];
    }

    public function sendFeedback(Classroom $classroom, array $data, User $fromUser): ClassFeedback
    {
        return ClassFeedback::create([
            ...$data,
            'classroom_id' => $classroom->id,
            'from_user_id' => $fromUser->id,
        ]);
    }

    public function listFeedback(Classroom $classroom, ?string $skill = null): LengthAwarePaginator
    {
        return ClassFeedback::query()
            ->where('classroom_id', $classroom->id)
            ->with(['fromUser', 'toUser'])
            ->when($skill, fn ($q, $v) => $q->where('skill', $v))
            ->orderByDesc('created_at')
            ->paginate();
    }

    // ── Assignments ──

    public function listAssignments(Classroom $classroom): Collection
    {
        return ClassAssignment::query()
            ->where('classroom_id', $classroom->id)
            ->with(['submissions.user'])
            ->withCount([
                'submissions',
                'submissions as graded_count' => fn ($q) => $q->where('status', AssignmentSubmissionStatus::Graded),
                'submissions as submitted_count' => fn ($q) => $q->where('status', AssignmentSubmissionStatus::Submitted),
                'submissions as pending_count' => fn ($q) => $q->where('status', AssignmentSubmissionStatus::Pending),
            ])
            ->orderByDesc('created_at')
            ->get();
    }

    public function showAssignment(ClassAssignment $assignment): ClassAssignment
    {
        $assignment->load(['submissions.user']);
        $assignment->loadCount('submissions');

        return $assignment;
    }

    public function createAssignment(Classroom $classroom, array $data): ClassAssignment
    {
        $assignment = ClassAssignment::create([
            ...$data,
            'classroom_id' => $classroom->id,
        ]);

        // Auto-create pending submissions for all members
        $memberIds = $classroom->members()->pluck('user_id');
        $rows = $memberIds->map(fn ($userId) => [
            'id' => (string) Str::uuid(),
            'assignment_id' => $assignment->id,
            'user_id' => $userId,
            'status' => AssignmentSubmissionStatus::Pending->value,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        if (count($rows) > 0) {
            ClassAssignmentSubmission::insert($rows);
        }

        return $assignment;
    }

    public function deleteAssignment(ClassAssignment $assignment): void
    {
        $assignment->delete();
    }

    public function startAssignment(ClassAssignment $assignment, User $user): ClassAssignmentSubmission
    {
        $submission = ClassAssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // If already submitted/graded and retry not allowed, return as-is
        if ($submission->status !== AssignmentSubmissionStatus::Pending && ! $assignment->allow_retry) {
            return $submission;
        }

        // Start exam session via SessionService
        if ($assignment->exam_id) {
            $sessionService = app(SessionService::class);
            $examSession = $sessionService->start($assignment->exam, $user->id);

            $submission->update([
                'exam_session_id' => $examSession->id,
                'status' => AssignmentSubmissionStatus::Submitted, // will be overridden on exam complete
            ]);
        }

        return $submission->load('examSession');
    }

    /**
     * Called after an exam session is completed. Auto-links score back to assignment submission.
     */
    public function onExamSessionCompleted(ExamSession $session): void
    {
        $submission = ClassAssignmentSubmission::where('exam_session_id', $session->id)->first();

        if (! $submission) {
            return;
        }

        $submission->update([
            'status' => AssignmentSubmissionStatus::Submitted,
            'score' => $session->overall_score,
            'submitted_at' => $session->completed_at ?? now(),
        ]);
    }

    public function submitAnswer(ClassAssignment $assignment, User $user, string $answer): ClassAssignmentSubmission
    {
        $submission = ClassAssignmentSubmission::where('assignment_id', $assignment->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $lateMinutes = null;
        if ($assignment->due_date && now()->gt($assignment->due_date)) {
            $lateMinutes = (int) $assignment->due_date->diffInMinutes(now());
        }

        $submission->update([
            'answer' => $answer,
            'status' => AssignmentSubmissionStatus::Submitted,
            'submitted_at' => now(),
            'late_minutes' => $lateMinutes,
        ]);

        return $submission;
    }

    public function gradeSubmission(ClassAssignmentSubmission $submission, float $score, ?string $feedback = null): ClassAssignmentSubmission
    {
        $data = [
            'status' => AssignmentSubmissionStatus::Graded,
            'score' => $score,
        ];

        if ($feedback !== null) {
            $data['feedback'] = $feedback;
        }

        $submission->update($data);

        return $submission;
    }

    public function showSubmission(ClassAssignmentSubmission $submission): ClassAssignmentSubmission
    {
        return $submission->load(['user', 'examSession', 'assignment']);
    }

    // ── Leaderboard ──

    public function leaderboard(Classroom $classroom): array
    {
        // Get all member user IDs
        $memberIds = $classroom->members()->pluck('user_id');

        if ($memberIds->isEmpty()) {
            return [];
        }

        // Get progress data: avg current_level score + total attempts per member
        $progressRows = DB::table('user_progress')
            ->whereIn('user_id', $memberIds)
            ->select('user_id')
            ->selectRaw("AVG(CASE current_level WHEN 'A2' THEN 3.5 WHEN 'B1' THEN 5.0 WHEN 'B2' THEN 7.0 WHEN 'C1' THEN 9.0 ELSE 2.0 END) as avg_level_score")
            ->selectRaw('SUM(attempt_count) as total_attempts')
            ->selectRaw('SUM(streak_count) as total_streak')
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        // Get avg exam score per member
        $examRows = DB::table('exam_sessions')
            ->whereIn('user_id', $memberIds)
            ->where('status', 'completed')
            ->whereNotNull('overall_score')
            ->select('user_id')
            ->selectRaw('AVG(overall_score) as avg_exam_score')
            ->selectRaw('COUNT(*) as exam_count')
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        // Combine and rank
        $entries = $memberIds->map(function ($userId) use ($progressRows, $examRows) {
            $user = User::find($userId);
            $progress = $progressRows->get($userId);
            $exam = $examRows->get($userId);

            $avgScore = $exam ? round((float) $exam->avg_exam_score, 1) : null;
            $levelScore = $progress ? round((float) $progress->avg_level_score, 1) : 0;
            $totalAttempts = $progress ? (int) $progress->total_attempts : 0;
            $totalStreak = $progress ? (int) $progress->total_streak : 0;
            $examCount = $exam ? (int) $exam->exam_count : 0;

            // Sort score: prioritize exam avg, fallback to level score
            $sortScore = $avgScore ?? $levelScore;

            return [
                'user_id' => $userId,
                'full_name' => $user?->full_name ?? $user?->email ?? $userId,
                'avg_score' => $avgScore ?? $levelScore,
                'total_attempts' => $totalAttempts + $examCount,
                'streak' => $totalStreak,
                'sort_score' => $sortScore,
            ];
        })
            ->filter(fn ($e) => $e['total_attempts'] > 0 || $e['avg_score'] > 0)
            ->sortByDesc('sort_score')
            ->values();

        $rank = 0;

        return $entries->map(function ($entry) use (&$rank) {
            $rank++;

            return [
                'rank' => $rank,
                'user_id' => $entry['user_id'],
                'full_name' => $entry['full_name'],
                'avg_score' => $entry['avg_score'],
                'total_attempts' => $entry['total_attempts'],
                'streak' => $entry['streak'],
            ];
        })->all();
    }

    private function generateInviteCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Classroom::where('invite_code', $code)->exists());

        return $code;
    }
}
