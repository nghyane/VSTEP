<?php

namespace App\Services;

use App\Enums\SessionStatus;
use App\Enums\Skill;
use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamService
{
    // --- Exam CRUD ---

    public function listExams(array $params, bool $adminView = false): LengthAwarePaginator
    {
        $query = Exam::query();

        if ($type = $params['type'] ?? null) {
            $query->where('type', $type);
        }

        if ($level = $params['level'] ?? null) {
            $query->where('level', $level);
        }

        if ($skill = $params['skill'] ?? null) {
            $query->whereRaw("blueprint->? IS NOT NULL", [$skill]);
        }

        if (!$adminView) {
            $query->where('is_active', true);
        }

        return $query->orderByDesc('created_at')->paginate($params['limit'] ?? 20);
    }

    public function createExam(array $data, string $userId): Exam
    {
        return Exam::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $userId,
        ]);
    }

    // --- Sessions ---

    public function startSession(Exam $exam, string $userId): ExamSession
    {
        if (!$exam->is_active) {
            throw ValidationException::withMessages(['exam' => ['Exam is not active.']]);
        }

        return DB::transaction(function () use ($exam, $userId) {
            // Lock to prevent race condition
            $existing = ExamSession::where('user_id', $userId)
                ->where('exam_id', $exam->id)
                ->where('status', SessionStatus::InProgress)
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

    public function listSessions(string $userId, array $params): LengthAwarePaginator
    {
        $query = ExamSession::with('exam')->where('user_id', $userId);

        if ($status = $params['status'] ?? null) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('started_at')
            ->paginate($params['limit'] ?? 20);
    }

    public function findSession(string $sessionId, string $userId): ExamSession
    {
        return ExamSession::with(['answers.question'])
            ->where('user_id', $userId)
            ->findOrFail($sessionId);
    }

    public function saveAnswer(string $sessionId, string $userId, array $data): void
    {
        $session = ExamSession::with('exam')
            ->where('user_id', $userId)
            ->where('status', SessionStatus::InProgress)
            ->findOrFail($sessionId);

        $this->assertQuestionInExam($session->exam, $data['question_id']);

        ExamAnswer::updateOrCreate(
            ['session_id' => $session->id, 'question_id' => $data['question_id']],
            ['answer' => $data['answer']],
        );
    }

    public function saveAnswersBatch(string $sessionId, string $userId, array $answers): int
    {
        $session = ExamSession::with('exam')
            ->where('user_id', $userId)
            ->where('status', SessionStatus::InProgress)
            ->findOrFail($sessionId);

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

    public function submitSession(string $sessionId, string $userId): ExamSession
    {
        $session = ExamSession::with('answers.question')
            ->where('user_id', $userId)
            ->where('status', SessionStatus::InProgress)
            ->findOrFail($sessionId);

        DB::transaction(function () use ($session) {
            $this->gradeObjectiveAnswers($session);
            $this->calculateScores($session);

            $session->update([
                'status' => SessionStatus::Completed,
                'completed_at' => now(),
            ]);
        });

        return $session->fresh();
    }

    private function assertQuestionInExam(Exam $exam, string $questionId): void
    {
        $blueprint = $exam->blueprint ?? [];
        $allIds = collect($blueprint)->flatMap(fn ($section) => $section['question_ids'] ?? []);

        if (!$allIds->contains($questionId)) {
            throw ValidationException::withMessages([
                'question_id' => ['Question does not belong to this exam.'],
            ]);
        }
    }

    private function gradeObjectiveAnswers(ExamSession $session): void
    {
        foreach ($session->answers as $answer) {
            $question = $answer->question;
            if (!$question || !in_array($question->skill, [Skill::Listening, Skill::Reading])) {
                continue;
            }

            $answerKey = $question->answer_key;
            if (!$answerKey || empty($answerKey['correctAnswers'])) {
                continue;
            }

            $userAnswers = $answer->answer['answers'] ?? [];
            $correctAnswers = $answerKey['correctAnswers'];

            $allCorrect = true;
            foreach ($correctAnswers as $key => $correct) {
                if (($userAnswers[$key] ?? null) !== $correct) {
                    $allCorrect = false;
                    break;
                }
            }

            $answer->is_correct = $allCorrect;
            $answer->save();
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
            if ($skillAnswers->isEmpty()) continue;

            $correct = $skillAnswers->where('is_correct', true)->count();
            $total = $skillAnswers->count();
            $update[$column] = $total > 0 ? round(($correct / $total) * 10, 1) : null;
        }

        $scores = array_filter([
            $session->listening_score ?? $update['listening_score'] ?? null,
            $session->reading_score ?? $update['reading_score'] ?? null,
            $session->writing_score,
            $session->speaking_score,
        ], fn ($v) => $v !== null);

        if (count($scores) > 0) {
            $update['overall_score'] = round(array_sum($scores) / count($scores), 1);
        }

        if (!empty($update)) {
            $session->update($update);
        }
    }
}
