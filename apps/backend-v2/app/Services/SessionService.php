<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Enums\VstepBand;
use App\Jobs\GradeSubmission;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\Submission;
use App\Support\VstepScoring;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SessionService
{
    public function __construct(
        private readonly ProgressService $progressService,
    ) {}

    public function start(Exam $exam, string $userId): ExamSession
    {
        if (! $exam->is_active) {
            throw ValidationException::withMessages(['exam' => ['Exam is not active.']]);
        }

        return DB::transaction(function () use ($exam, $userId) {
            $existing = ExamSession::forUser($userId)
                ->where('exam_id', $exam->id)
                ->inProgress()
                ->lockForUpdate()
                ->first();

            if ($existing) {
                if ($this->isExpired($existing)) {
                    $existing->update(['status' => SessionStatus::Abandoned, 'completed_at' => now()]);
                } else {
                    return $existing;
                }
            }

            return ExamSession::create([
                'user_id' => $userId,
                'exam_id' => $exam->id,
                'status' => SessionStatus::InProgress,
                'started_at' => now(),
            ]);
        });
    }

    public function list(string $userId, ?string $status = null, ?string $examId = null): LengthAwarePaginator
    {
        return ExamSession::with('exam')
            ->forUser($userId)
            ->when($status, fn ($q, $v) => $q->where('status', $v))
            ->when($examId, fn ($q, $v) => $q->where('exam_id', $v))
            ->orderByDesc('started_at')
            ->paginate();
    }

    public function show(ExamSession $session): ExamSession
    {
        $session->load(['exam', 'answers']);

        $questionIds = collect($session->exam->blueprint)
            ->flatMap(fn ($section) => $section['question_ids'] ?? []);

        $questionsKeyed = Question::whereIn('id', $questionIds)->get()->keyBy('id');
        $questions = $questionIds->map(fn ($id) => $questionsKeyed->get($id))->filter()->values();

        if ($session->status === SessionStatus::InProgress) {
            $questions->each->makeHidden(['answer_key', 'explanation']);
        }

        $session->setRelation('questions', $questions);

        // Load submission results (AI feedback) for completed sessions
        if (in_array($session->status, [SessionStatus::Submitted, SessionStatus::Completed], true)) {
            $session->load(['submissions' => fn ($q) => $q->with('question:id,skill,part')]);
        }

        return $session;
    }

    public function saveAnswer(ExamSession $session, array $data): void
    {
        $this->assertInProgress($session);

        $session->loadMissing('exam');
        $this->assertQuestionInExam($session->exam, $data['question_id']);

        ExamAnswer::updateOrCreate(
            ['session_id' => $session->id, 'question_id' => $data['question_id']],
            ['answer' => $data['answer']],
        );
    }

    public function saveAnswersBatch(ExamSession $session, array $answers): int
    {
        $this->assertInProgress($session);

        $session->loadMissing('exam');

        $saved = 0;
        DB::transaction(function () use ($session, $answers, &$saved) {
            foreach ($answers as $item) {
                $this->assertQuestionInExam($session->exam, $item['question_id']);
                ExamAnswer::updateOrCreate(
                    ['session_id' => $session->id, 'question_id' => $item['question_id']],
                    ['answer' => $item['answer']],
                );
                $saved++;
            }
        });

        return $saved;
    }

    public function submit(ExamSession $session): ExamSession
    {
        if ($session->status === SessionStatus::Completed) {
            return $session;
        }

        $this->assertInProgress($session);

        $session->load('answers.question');

        DB::transaction(function () use ($session) {
            $this->gradeObjectiveAnswers($session);
            $this->dispatchSubjectiveGrading($session);
            $this->calculateScores($session);

            $hasPendingSubjective = $session->submissions()->exists();

            $session->update([
                'status' => $hasPendingSubjective ? SessionStatus::Submitted : SessionStatus::Completed,
                'completed_at' => now(),
            ]);

            if (! $hasPendingSubjective) {
                $this->applyScoresToProgress($session);
            }

            // Auto-update assignment submission if linked
            app(ClassroomService::class)->onExamSessionCompleted($session);
        });

        return $session->fresh();
    }

    private function applyScoresToProgress(ExamSession $session): void
    {
        foreach (Skill::cases() as $skill) {
            $score = $session->{$skill->scoreColumn()};
            if ($score === null) {
                continue;
            }

            $this->progressService->applyScore($session->user_id, $skill, $score);
        }
    }

    /**
     * Create Submission records for writing/speaking answers and dispatch AI grading jobs.
     * Each GradeSubmission job, upon completion, will update session scores via updateSessionScores().
     */
    private function dispatchSubjectiveGrading(ExamSession $session): void
    {
        foreach ($session->answers as $answer) {
            $question = $answer->question;
            if (! $question || $question->skill->isObjective()) {
                continue;
            }

            $submission = Submission::create([
                'user_id' => $session->user_id,
                'session_id' => $session->id,
                'question_id' => $question->id,
                'skill' => $question->skill,
                'answer' => $answer->answer,
                'status' => SubmissionStatus::Pending,
            ]);

            GradeSubmission::dispatch($submission->id);
        }
    }

    private function assertQuestionInExam(Exam $exam, string $questionId): void
    {
        $allIds = collect($exam->blueprint)->flatMap(fn ($section) => $section['question_ids'] ?? []);

        if (! $allIds->contains($questionId)) {
            throw ValidationException::withMessages([
                'question_id' => ['Question does not belong to this exam.'],
            ]);
        }
    }

    private function gradeObjectiveAnswers(ExamSession $session): void
    {
        foreach ($session->answers as $answer) {
            $question = $answer->question;
            if (! $question || ! $question->skill->isObjective()) {
                continue;
            }

            $result = $question->gradeObjective($answer->answer['answers'] ?? []);
            if ($result === null) {
                continue;
            }

            $answer->is_correct = $result['all_correct'];
            $answer->raw_ratio = $result['raw_ratio'];
            $answer->save();
        }
    }

    private function calculateScores(ExamSession $session): void
    {
        $objectiveSkills = [
            ['skill' => Skill::Listening, 'column' => 'listening_score'],
            ['skill' => Skill::Reading, 'column' => 'reading_score'],
        ];

        $update = [];

        foreach ($objectiveSkills as $entry) {
            $skill = $entry['skill'];
            $column = $entry['column'];
            $skillAnswers = $session->answers->filter(fn ($a) => $a->question?->skill === $skill);
            if ($skillAnswers->isEmpty()) {
                continue;
            }

            $total = $skillAnswers->count();
            $rawRatio = $total > 0
                ? $skillAnswers->sum(fn ($answer) => $answer->raw_ratio ?? (($answer->is_correct ?? false) ? 1.0 : 0.0)) / $total
                : 0.0;
            $update[$column] = VstepScoring::score($rawRatio);
        }

        $scores = array_filter([
            $update['listening_score'] ?? $session->listening_score,
            $update['reading_score'] ?? $session->reading_score,
            $session->writing_score,
            $session->speaking_score,
        ], fn ($v) => $v !== null);

        if (count($scores) > 0) {
            $overall = array_sum($scores) / count($scores);
            $update['overall_score'] = VstepScoring::round($overall);
            $update['overall_band'] = VstepScoring::band($update['overall_score']);
        }

        if (! empty($update)) {
            $session->update($update);
        }
    }

    private function isExpired(ExamSession $session): bool
    {
        $session->loadMissing('exam');

        if (! $session->exam->duration_minutes) {
            return false;
        }

        return $session->started_at->addMinutes($session->exam->duration_minutes)->isPast();
    }

    private function assertInProgress(ExamSession $session): void
    {
        if ($session->status !== SessionStatus::InProgress) {
            throw ValidationException::withMessages(['session' => ['Session is not in progress.']]);
        }

        if ($this->isExpired($session)) {
            $session->update(['status' => SessionStatus::Abandoned, 'completed_at' => now()]);

            throw ValidationException::withMessages(['session' => ['Session has expired.']]);
        }
    }

    /**
     * Recalculate subjective skill scores after a submission is graded.
     * Called by GradeSubmission job when submission belongs to a session.
     */
    public function updateSubjectiveScores(Submission $submission): void
    {
        if (! $submission->session_id) {
            return;
        }

        $session = $submission->session()->with(['submissions.question', 'exam'])->first();
        if (! $session) {
            return;
        }

        $this->reconcileSessionResult($session);
    }

    public function reconcileSessionResult(ExamSession $session): void
    {
        $session->loadMissing(['submissions.question', 'exam']);
        $subjectiveSubmissions = $session->submissions;

        if ($subjectiveSubmissions->isEmpty()) {
            if ($session->status !== SessionStatus::Completed) {
                $session->update(['status' => SessionStatus::Completed]);
                $this->applyScoresToProgress($session->fresh());
            }

            return;
        }

        if ($subjectiveSubmissions->contains(fn ($s) => in_array($s->status, [SubmissionStatus::Pending, SubmissionStatus::Processing], true))) {
            if ($session->status !== SessionStatus::Submitted) {
                $session->update(['status' => SessionStatus::Submitted]);
            }

            return;
        }

        $update = [];

        foreach ([Skill::Writing, Skill::Speaking] as $skill) {
            $skillSubmissions = $subjectiveSubmissions->where('skill', $skill)->values();
            if ($skillSubmissions->isEmpty()) {
                continue;
            }

            $column = $skill->scoreColumn();
            $hasFailed = $skillSubmissions->contains(fn ($s) => $s->status === SubmissionStatus::Failed);

            if ($hasFailed) {
                $update[$column] = null;

                continue;
            }

            if ($skill === Skill::Writing) {
                $task1 = $skillSubmissions->first(fn ($s) => $s->question->part === 1);
                $task2 = $skillSubmissions->first(fn ($s) => $s->question->part === 2);

                if ($task1?->score !== null && $task2?->score !== null) {
                    $update[$column] = VstepScoring::writingOverall($task1->score, $task2->score);
                } elseif ($skillSubmissions->count() === 1 && $skillSubmissions->first()?->score !== null) {
                    $update[$column] = $skillSubmissions->first()->score;
                }

                continue;
            }

            $partScores = $skillSubmissions
                ->pluck('score')
                ->filter(fn ($score) => $score !== null)
                ->values()
                ->all();

            if (! empty($partScores)) {
                $update[$column] = VstepScoring::speakingOverall(...$partScores);
            }
        }

        $requiredSkillColumns = collect($session->exam->blueprint ?? [])
            ->pluck('skill')
            ->filter()
            ->unique()
            ->mapWithKeys(fn ($skill) => [$skill => Skill::from($skill)->scoreColumn()]);

        $session->fill($update);

        $allRequiredScoresAvailable = $requiredSkillColumns
            ->every(fn (string $column) => $session->{$column} !== null);

        if ($allRequiredScoresAvailable) {
            $scores = $requiredSkillColumns
                ->map(fn (string $column) => $session->{$column})
                ->all();

            $overall = VstepScoring::round(array_sum($scores) / count($scores));
            $update['overall_score'] = $overall;
            $update['overall_band'] = VstepBand::fromScore($overall);
        } else {
            $update['overall_score'] = null;
            $update['overall_band'] = null;
        }

        $wasCompleted = $session->status === SessionStatus::Completed;

        $session->update([
            ...$update,
            'status' => SessionStatus::Completed,
        ]);

        if (! $wasCompleted && $allRequiredScoresAvailable && ! $subjectiveSubmissions->contains(fn ($s) => $s->status === SubmissionStatus::ReviewPending)) {
            $this->applyScoresToProgress($session->fresh());
        }
    }

    public function abandonExpired(): int
    {
        return ExamSession::inProgress()
            ->whereHas('exam', fn ($q) => $q->whereNotNull('duration_minutes'))
            ->get()
            ->filter(fn ($s) => $this->isExpired($s))
            ->each(fn ($s) => $s->update(['status' => SessionStatus::Abandoned, 'completed_at' => now()]))
            ->count();
    }
}
