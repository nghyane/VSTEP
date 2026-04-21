<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\PracticeVocabExerciseAttempt;
use App\Models\PracticeVocabReview;
use App\Models\Profile;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Srs\FsrsConfig;
use App\Srs\FsrsScheduler;
use App\Srs\FsrsState;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Vocabulary + FSRS orchestration.
 *
 * Flow:
 * 1. User mở topic → getTopicForProfile() trả words + FSRS state
 * 2. User review 1 từ:
 *    - review(): load state → scheduler.schedule() → persist state + log review
 * 3. User làm exercise:
 *    - attemptExercise(): validate, log attempt
 * 4. Queue due hôm nay: buildDueQueue(profile, limit)
 */
class VocabService
{
    public function __construct(
        private readonly FsrsScheduler $scheduler,
        private readonly FsrsConfig $config,
    ) {}

    /**
     * @return Collection<int,VocabTopic>
     */
    public function listPublishedTopics(): Collection
    {
        return VocabTopic::query()
            ->where('is_published', true)
            ->orderBy('level')
            ->orderBy('display_order')
            ->get();
    }

    /**
     * @return array{topic: VocabTopic, words: array<int,array{word: VocabWord, state: FsrsState}>, exercises: Collection<int,VocabExercise>}
     */
    public function getTopicForProfile(VocabTopic $topic, Profile $profile): array
    {
        $words = $topic->words()->orderBy('display_order')->get();
        $states = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->whereIn('word_id', $words->pluck('id'))
            ->get()
            ->keyBy('word_id');

        $wordsWithState = $words->map(fn (VocabWord $word) => [
            'word' => $word,
            'state' => $this->stateFromRow($states->get($word->id)),
        ])->all();

        $exercises = $topic->exercises()->orderBy('display_order')->get();

        return [
            'topic' => $topic,
            'words' => $wordsWithState,
            'exercises' => $exercises,
        ];
    }

    /**
     * @return array{review: PracticeVocabReview, state: FsrsState}
     */
    public function review(
        Profile $profile,
        VocabWord $word,
        int $rating,
        ?PracticeSession $session = null,
    ): array {
        return DB::transaction(function () use ($profile, $word, $rating, $session) {
            $row = ProfileVocabSrsState::query()
                ->where('profile_id', $profile->id)
                ->where('word_id', $word->id)
                ->lockForUpdate()
                ->first();

            $previous = $this->stateFromRow($row);
            $nowMs = (int) (microtime(true) * 1000);
            $next = $this->scheduler->schedule($previous, $rating, $nowMs);

            $this->persistState($profile, $word, $next);

            $review = PracticeVocabReview::create([
                'profile_id' => $profile->id,
                'word_id' => $word->id,
                'session_id' => $session?->id,
                'rating' => $rating,
                'previous_state' => $previous->toArray($this->config, $nowMs),
                'new_state' => $next->toArray($this->config, $nowMs),
                'reviewed_at' => now(),
            ]);

            return ['review' => $review, 'state' => $next];
        });
    }

    /**
     * @param  array<string,mixed>  $answer
     * @return array{attempt: PracticeVocabExerciseAttempt, is_correct: bool, explanation: string}
     */
    public function attemptExercise(
        Profile $profile,
        VocabExercise $exercise,
        array $answer,
        ?PracticeSession $session = null,
    ): array {
        $isCorrect = $exercise->isAnswerCorrect($answer);

        $attempt = PracticeVocabExerciseAttempt::create([
            'profile_id' => $profile->id,
            'exercise_id' => $exercise->id,
            'session_id' => $session?->id,
            'answer' => $answer,
            'is_correct' => $isCorrect,
            'attempted_at' => now(),
        ]);

        return [
            'attempt' => $attempt,
            'is_correct' => $isCorrect,
            'explanation' => $exercise->explanation,
        ];
    }

    /**
     * @return array{new: int, learning: int, review: int, next_due_at: string|null, items: array<int,array{word: VocabWord, state: FsrsState}>}
     */
    public function buildDueQueue(Profile $profile, int $limit = 50): array
    {
        $now = now();
        $learnAheadMinutes = 20;
        $learnAheadCutoff = $now->copy()->addMinutes($learnAheadMinutes);

        // 1. Cards due now (all kinds)
        $dueNow = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('due_at', '<=', $now)
            ->orderBy('due_at')
            ->limit($limit)
            ->get();

        // 2. Learning cards due within learn-ahead window (not yet due but coming soon)
        $learnAhead = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('due_at', '>', $now)
            ->where('due_at', '<=', $learnAheadCutoff)
            ->whereIn('state_kind', ['learning', 'relearning'])
            ->orderBy('due_at')
            ->limit($limit)
            ->get();

        $allStates = $dueNow->merge($learnAhead)->unique('word_id')->take($limit);
        $wordIds = $allStates->pluck('word_id');
        $words = VocabWord::query()->whereIn('id', $wordIds)->get()->keyBy('id');

        $counts = ['new' => 0, 'learning' => 0, 'review' => 0];
        $items = [];
        foreach ($allStates as $row) {
            $state = $this->stateFromRow($row);
            $word = $words->get($row->word_id);
            if ($word === null) {
                continue;
            }

            $items[] = ['word' => $word, 'state' => $state];
            if ($state->isNew()) {
                $counts['new']++;
            } elseif ($state->isLearning()) {
                $counts['learning']++;
            } else {
                $counts['review']++;
            }
        }

        // Next due card outside current window
        $nextDueAt = null;
        if (count($items) === 0) {
            $nextDue = ProfileVocabSrsState::query()
                ->where('profile_id', $profile->id)
                ->where('due_at', '>', $learnAheadCutoff)
                ->orderBy('due_at')
                ->value('due_at');
            $nextDueAt = $nextDue?->toIso8601String();
        }

        return [
            'new' => $counts['new'],
            'learning' => $counts['learning'],
            'review' => $counts['review'],
            'next_due_at' => $nextDueAt,
            'items' => $items,
        ];
    }

    private function stateFromRow(?ProfileVocabSrsState $row): FsrsState
    {
        if ($row === null) {
            return FsrsState::new();
        }

        return new FsrsState(
            kind: $row->state_kind ?? 'new',
            difficulty: (float) $row->difficulty,
            stability: (float) $row->stability,
            lapses: (int) $row->lapses,
            remainingSteps: (int) ($row->remaining_steps ?? 0),
            dueAtMs: $row->due_at ? (int) ($row->due_at->getTimestamp() * 1000) : null,
            lastReviewAtMs: $row->last_review_at ? (int) ($row->last_review_at->getTimestamp() * 1000) : null,
        );
    }

    private function persistState(Profile $profile, VocabWord $word, FsrsState $state): void
    {
        ProfileVocabSrsState::query()->updateOrInsert(
            ['profile_id' => $profile->id, 'word_id' => $word->id],
            [
                'state_kind' => $state->kind,
                'difficulty' => $state->difficulty,
                'stability' => $state->stability,
                'lapses' => $state->lapses,
                'remaining_steps' => $state->remainingSteps,
                'due_at' => $state->dueAtMs !== null
                    ? (new \DateTimeImmutable('@'.intdiv($state->dueAtMs, 1000)))->format('Y-m-d H:i:s')
                    : now()->format('Y-m-d H:i:s'),
                'last_review_at' => $state->lastReviewAtMs !== null
                    ? (new \DateTimeImmutable('@'.intdiv($state->lastReviewAtMs, 1000)))->format('Y-m-d H:i:s')
                    : null,
                'updated_at' => now()->format('Y-m-d H:i:s'),
            ],
        );
    }
}
