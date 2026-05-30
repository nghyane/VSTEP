<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\MasteryLevel;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\PracticeGrammarAttempt;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\ProfileGrammarMastery;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Grammar orchestration: content listing + attempt log + mastery cache.
 *
 * No SRS (rule #27). Mastery = simple accuracy tracking với thresholds
 * (xem Enums\MasteryLevel::compute).
 */
final class GrammarService
{
    /**
     * @return Collection<int,GrammarPoint>
     */
    public function listPublishedPoints(): Collection
    {
        return GrammarPoint::query()
            ->where('is_published', true)
            ->orderBy('display_order')
            ->with(['levels', 'tasks', 'functions'])
            ->get();
    }

    /**
     * @return array<string, ProfileGrammarMastery>
     */
    public function getMasteryMap(Profile $profile): array
    {
        return ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->get()
            ->keyBy('grammar_point_id')
            ->all();
    }

    /**
     * @return array<string, int> grammar_point_id => count of active MCQ exercises
     */
    public function getExerciseCounts(): array
    {
        return GrammarExercise::query()
            ->where('is_active', true)
            ->where('kind', 'mcq')
            ->selectRaw('grammar_point_id, count(*) as cnt')
            ->groupBy('grammar_point_id')
            ->pluck('cnt', 'grammar_point_id')
            ->all();
    }

    /**
     * @return array<string, int> grammar_point_id => distinct exercises answered correctly
     */
    public function getDistinctCorrectMap(Profile $profile): array
    {
        return PracticeGrammarAttempt::query()
            ->where('profile_id', $profile->id)
            ->where('is_correct', true)
            ->selectRaw('grammar_point_id, count(distinct exercise_id) as cnt')
            ->groupBy('grammar_point_id')
            ->pluck('cnt', 'grammar_point_id')
            ->all();
    }

    /**
     * Load full detail cho detail page: structures, examples, mistakes, tips,
     * exercises, + mastery của profile.
     *
     * @return array{point: GrammarPoint, mastery: ProfileGrammarMastery|null}
     */
    public function getPointForProfile(GrammarPoint $point, Profile $profile): array
    {
        $point->load([
            'levels', 'tasks', 'functions',
            'structures', 'examples', 'commonMistakes', 'vstepTips',
            'exercises' => fn ($query) => $query->where('is_active', true)->where('kind', 'mcq'),
        ]);

        $mastery = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $point->id)
            ->first();

        return ['point' => $point, 'mastery' => $mastery];
    }

    /**
     * Ghi attempt + update mastery cache atomic.
     *
     * @param  array<string,mixed>  $answer
     * @return array{attempt: PracticeGrammarAttempt, is_correct: bool, explanation: string, mastery: ProfileGrammarMastery}
     */
    public function attemptExercise(
        Profile $profile,
        GrammarExercise $exercise,
        array $answer,
        ?PracticeSession $session = null,
    ): array {
        $isCorrect = $exercise->isAnswerCorrect($answer);

        return DB::transaction(function () use ($profile, $exercise, $answer, $session, $isCorrect) {
            $attempt = PracticeGrammarAttempt::create([
                'profile_id' => $profile->id,
                'grammar_point_id' => $exercise->grammar_point_id,
                'exercise_id' => $exercise->id,
                'session_id' => $session?->id,
                'answer' => $answer,
                'is_correct' => $isCorrect,
                'attempted_at' => now(),
            ]);

            $mastery = $this->updateMastery($profile, $exercise->grammar_point_id, $isCorrect);

            return [
                'attempt' => $attempt,
                'is_correct' => $isCorrect,
                'explanation' => $exercise->explanation,
                'mastery' => $mastery,
            ];
        });
    }

    private function updateMastery(
        Profile $profile,
        string $grammarPointId,
        bool $isCorrect,
    ): ProfileGrammarMastery {
        $row = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $grammarPointId)
            ->lockForUpdate()
            ->first();

        $attempts = ($row?->attempts ?? 0) + 1;
        $correct = ($row?->correct ?? 0) + ($isCorrect ? 1 : 0);
        $distinctCorrect = PracticeGrammarAttempt::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $grammarPointId)
            ->where('is_correct', true)
            ->distinct('exercise_id')
            ->count('exercise_id');
        $level = MasteryLevel::compute($attempts, $correct, $distinctCorrect);

        ProfileGrammarMastery::query()->updateOrInsert(
            [
                'profile_id' => $profile->id,
                'grammar_point_id' => $grammarPointId,
            ],
            [
                'attempts' => $attempts,
                'correct' => $correct,
                'last_practiced_at' => now()->format('Y-m-d H:i:s'),
                'computed_level' => $level->value,
                'updated_at' => now()->format('Y-m-d H:i:s'),
            ],
        );

        /** @var ProfileGrammarMastery $fresh */
        $fresh = ProfileGrammarMastery::query()
            ->where('profile_id', $profile->id)
            ->where('grammar_point_id', $grammarPointId)
            ->first();

        return $fresh;
    }
}
