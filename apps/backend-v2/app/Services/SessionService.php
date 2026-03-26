<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
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

            $session->update([
                'status' => SessionStatus::Completed,
                'completed_at' => now(),
            ]);

            $this->applyScoresToProgress($session);
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
                'status' => SubmissionStatus::Processing,
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
        $correctIds = [];
        $incorrectIds = [];

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

            if ($result['all_correct']) {
                $correctIds[] = $answer->id;
            } else {
                $incorrectIds[] = $answer->id;
            }
        }

        if ($correctIds) {
            ExamAnswer::whereIn('id', $correctIds)->update(['is_correct' => true]);
        }
        if ($incorrectIds) {
            ExamAnswer::whereIn('id', $incorrectIds)->update(['is_correct' => false]);
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

            $correct = $skillAnswers->where('is_correct', true)->count();
            $total = $skillAnswers->count();
            $update[$column] = $total > 0 ? VstepScoring::score($correct / $total) : 0.0;
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
