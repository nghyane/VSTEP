<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Enums\VstepBand;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\Question;
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
                return $existing;
            }

            return ExamSession::create([
                'user_id' => $userId,
                'exam_id' => $exam->id,
                'status' => SessionStatus::InProgress,
                'started_at' => now(),
            ]);
        });
    }

    public function list(string $userId, ?string $status = null): LengthAwarePaginator
    {
        return ExamSession::with('exam')
            ->forUser($userId)
            ->when($status, fn ($q, $v) => $q->where('status', $v))
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
        if ($session->status !== SessionStatus::InProgress) {
            throw ValidationException::withMessages(['session' => ['Session is not in progress.']]);
        }

        $session->loadMissing('exam');
        $this->assertQuestionInExam($session->exam, $data['question_id']);

        ExamAnswer::updateOrCreate(
            ['session_id' => $session->id, 'question_id' => $data['question_id']],
            ['answer' => $data['answer']],
        );
    }

    public function saveAnswersBatch(ExamSession $session, array $answers): int
    {
        if ($session->status !== SessionStatus::InProgress) {
            throw ValidationException::withMessages(['session' => ['Session is not in progress.']]);
        }

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

        if ($session->status !== SessionStatus::InProgress) {
            throw ValidationException::withMessages(['session' => ['Session is not in progress.']]);
        }

        $session->load('answers.question');

        DB::transaction(function () use ($session) {
            $this->gradeObjectiveAnswers($session);
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
        $scoreMap = [
            Skill::Listening => $session->listening_score,
            Skill::Reading => $session->reading_score,
            Skill::Writing => $session->writing_score,
            Skill::Speaking => $session->speaking_score,
        ];

        foreach ($scoreMap as $skill => $score) {
            if ($score === null) {
                continue;
            }

            $this->progressService->applyScore($session->user_id, $skill, $score);
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
            Skill::Listening => 'listening_score',
            Skill::Reading => 'reading_score',
        ];

        $update = [];

        foreach ($objectiveSkills as $skill => $column) {
            $skillAnswers = $session->answers->filter(fn ($a) => $a->question?->skill === $skill);
            if ($skillAnswers->isEmpty()) {
                continue;
            }

            $correct = $skillAnswers->where('is_correct', true)->count();
            $total = $skillAnswers->count();
            $raw = $total > 0 ? ($correct / $total) * 10 : 0.0;
            $update[$column] = VstepBand::roundScore($raw);
        }

        $scores = array_filter([
            $update['listening_score'] ?? $session->listening_score,
            $update['reading_score'] ?? $session->reading_score,
            $session->writing_score,
            $session->speaking_score,
        ], fn ($v) => $v !== null);

        if (count($scores) > 0) {
            $overall = array_sum($scores) / count($scores);
            $update['overall_score'] = VstepBand::roundScore($overall);
            $update['overall_band'] = VstepBand::fromScore($update['overall_score']);
        }

        if (! empty($update)) {
            $session->update($update);
        }
    }
}
