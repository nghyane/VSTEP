<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Models\PracticeMcqAnswer;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Models\PracticeSession;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Unified MCQ skill service cho listening + reading drill.
 *
 * Skill = 'listening' | 'reading'. Exercise model types khác nhưng flow
 * giống hệt: list → start session → submit answers → score sync.
 *
 * Submit KHÔNG tạo job, chấm ngay vì MCQ là objective scoring.
 */
class McqSkillService
{
    public function __construct(
        private readonly PracticeSessionService $sessionService,
    ) {}

    /**
     * @return Collection<int,PracticeListeningExercise|PracticeReadingExercise>
     */
    public function listExercises(string $skill, ?int $part = null): Collection
    {
        $class = $this->exerciseClass($skill);
        $query = $class::query()->where('is_published', true);
        if ($part !== null) {
            $query->where('part', $part);
        }

        return $query->orderBy('part')->orderBy('created_at')->get();
    }

    /**
     * Load exercise + questions (không expose correct_index — resource sẽ strip).
     *
     * @return array{exercise: Model, questions: Collection<int,Model>}
     */
    public function getExercise(string $skill, string $id): array
    {
        $class = $this->exerciseClass($skill);
        /** @var Model $exercise */
        $exercise = $class::query()->findOrFail($id);
        $questions = $exercise->questions()->orderBy('display_order')->get();

        return ['exercise' => $exercise, 'questions' => $questions];
    }

    public function startSession(
        Profile $profile,
        string $skill,
        string $exerciseId,
    ): PracticeSession {
        $class = $this->exerciseClass($skill);
        /** @var Model $exercise */
        $exercise = $class::query()->findOrFail($exerciseId);

        return $this->sessionService->start($profile, $skill, $exercise);
    }

    /**
     * Submit answers cho 1 session. Chấm sync + complete session + trả score.
     *
     * @param  array<int,array{question_id:string,selected_index:int}>  $answers
     * @return array{score: int, total: int, items: array<int,array{question_id:string,is_correct:bool,correct_index:int,explanation:string}>, session: PracticeSession}
     */
    public function submitSession(
        Profile $profile,
        PracticeSession $session,
        string $skill,
        array $answers,
    ): array {
        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->module !== $skill) {
            throw ValidationException::withMessages([
                'skill' => ["Session module ({$session->module}) does not match skill ({$skill})."],
            ]);
        }
        if ($session->ended_at !== null) {
            throw ValidationException::withMessages([
                'session' => ['Session already submitted.'],
            ]);
        }

        $questionClass = $this->questionClass($skill);
        $questionType = $this->questionRefType($skill);

        $exercise = $this->loadExerciseForSession($session, $skill);
        $questionMap = $questionClass::query()
            ->where('exercise_id', $exercise->getKey())
            ->get()
            ->keyBy('id');

        return DB::transaction(function () use ($session, $answers, $questionMap, $questionType) {
            $items = [];
            $correctCount = 0;
            foreach ($answers as $answer) {
                $questionId = $answer['question_id'];
                $selected = (int) $answer['selected_index'];

                $question = $questionMap->get($questionId);
                if ($question === null) {
                    throw ValidationException::withMessages([
                        'question_id' => ["Question {$questionId} not in exercise."],
                    ]);
                }

                $isCorrect = $selected === $question->correct_index;
                if ($isCorrect) {
                    $correctCount++;
                }

                PracticeMcqAnswer::updateOrCreate(
                    [
                        'session_id' => $session->id,
                        'question_type' => $questionType,
                        'question_id' => $question->id,
                    ],
                    [
                        'selected_index' => $selected,
                        'is_correct' => $isCorrect,
                        'answered_at' => now(),
                    ],
                );

                $items[] = [
                    'question_id' => $question->id,
                    'is_correct' => $isCorrect,
                    'correct_index' => $question->correct_index,
                    'explanation' => $question->explanation,
                ];
            }

            $this->sessionService->complete($session);

            return [
                'score' => $correctCount,
                'total' => $questionMap->count(),
                'items' => $items,
                'session' => $session->refresh(),
            ];
        });
    }

    private function loadExerciseForSession(PracticeSession $session, string $skill): Model
    {
        $class = $this->exerciseClass($skill);

        /** @var Model $exercise */
        $exercise = $class::query()->findOrFail($session->content_ref_id);

        return $exercise;
    }

    /**
     * @return class-string<Model>
     */
    private function exerciseClass(string $skill): string
    {
        return match ($skill) {
            'listening' => PracticeListeningExercise::class,
            'reading' => PracticeReadingExercise::class,
            default => throw new \InvalidArgumentException("Unknown MCQ skill {$skill}."),
        };
    }

    /**
     * @return class-string<Model>
     */
    private function questionClass(string $skill): string
    {
        return match ($skill) {
            'listening' => PracticeListeningQuestion::class,
            'reading' => PracticeReadingQuestion::class,
            default => throw new \InvalidArgumentException("Unknown MCQ skill {$skill}."),
        };
    }

    private function questionRefType(string $skill): string
    {
        return match ($skill) {
            'listening' => 'practice_listening_question',
            'reading' => 'practice_reading_question',
            default => throw new \InvalidArgumentException("Unknown MCQ skill {$skill}."),
        };
    }
}
