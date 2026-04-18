<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SrsStateKind;
use App\Models\PracticeSession;
use App\Models\PracticeVocabExerciseAttempt;
use App\Models\PracticeVocabReview;
use App\Models\Profile;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Srs\SrsCardState;
use App\Srs\SrsConfig;
use App\Srs\SrsScheduler;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Vocabulary + SRS orchestration.
 *
 * Flow:
 * 1. User mở topic → getTopicForProfile() trả words + SRS state
 * 2. User review 1 từ:
 *    - review(): load state → scheduler.nextState() → persist state + log review
 * 3. User làm exercise:
 *    - attemptExercise(): validate, log attempt, update support usage if session
 * 4. Queue due hôm nay: buildDueQueue(profile, limit)
 */
class VocabService
{
    public function __construct(
        private readonly SrsScheduler $scheduler,
        private readonly SrsConfig $config,
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
     * Load topic + words + exercises + current SRS state cho profile.
     *
     * @return array{topic: VocabTopic, words: array<int,array{word: VocabWord, state: SrsCardState}>, exercises: Collection<int,VocabExercise>}
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
     * Ghi review event + update SRS state atomic.
     *
     * @return array{review: PracticeVocabReview, state: SrsCardState}
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
            $next = $this->scheduler->nextState($previous, $rating, $nowMs);

            $this->persistState($profile, $word, $next);

            $review = PracticeVocabReview::create([
                'profile_id' => $profile->id,
                'word_id' => $word->id,
                'session_id' => $session?->id,
                'rating' => $rating,
                'previous_state' => $previous->toArray(),
                'new_state' => $next->toArray(),
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
     * Queue due cho profile hôm nay (+ overdue). Cross-topic.
     *
     * @return array{new: int, learning: int, review: int, items: array<int,array{word: VocabWord, state: SrsCardState}>}
     */
    public function buildDueQueue(Profile $profile, int $limit = 50): array
    {
        $now = now();
        $states = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('due_at', '<=', $now)
            ->orderBy('due_at')
            ->limit($limit)
            ->get();

        $wordIds = $states->pluck('word_id');
        $words = VocabWord::query()->whereIn('id', $wordIds)->get()->keyBy('id');

        $counts = ['new' => 0, 'learning' => 0, 'review' => 0];
        $items = [];
        foreach ($states as $row) {
            $state = $this->stateFromRow($row);
            $word = $words->get($row->word_id);
            if ($word === null) {
                continue;
            }

            $items[] = ['word' => $word, 'state' => $state];
            match ($state->kind) {
                SrsStateKind::New => $counts['new']++,
                SrsStateKind::Learning, SrsStateKind::Relearning => $counts['learning']++,
                SrsStateKind::Review => $counts['review']++,
            };
        }

        return [
            'new' => $counts['new'],
            'learning' => $counts['learning'],
            'review' => $counts['review'],
            'items' => $items,
        ];
    }

    private function stateFromRow(?ProfileVocabSrsState $row): SrsCardState
    {
        if ($row === null) {
            return SrsCardState::new();
        }

        return SrsCardState::fromArray([
            'kind' => $row->state_kind->value,
            'due_at_ms' => $row->due_at ? (int) ($row->due_at->getTimestamp() * 1000) : null,
            'remaining_steps' => $row->remaining_steps,
            'interval_days' => $row->interval_days,
            'ease_factor' => $row->ease_factor,
            'lapses' => $row->lapses,
            'review_interval_days' => $row->review_interval_days,
            'review_ease_factor' => $row->review_ease_factor,
        ]);
    }

    private function persistState(Profile $profile, VocabWord $word, SrsCardState $state): void
    {
        ProfileVocabSrsState::query()->updateOrInsert(
            ['profile_id' => $profile->id, 'word_id' => $word->id],
            [
                'state_kind' => $state->kind->value,
                'due_at' => $state->dueAtMs !== null
                    ? (new \DateTimeImmutable('@'.intdiv($state->dueAtMs, 1000)))->format('Y-m-d H:i:s')
                    : now()->format('Y-m-d H:i:s'),
                'interval_days' => $state->intervalDays,
                'ease_factor' => $state->easeFactor,
                'lapses' => $state->lapses,
                'remaining_steps' => $state->remainingSteps,
                'review_interval_days' => $state->reviewIntervalDays,
                'review_ease_factor' => $state->reviewEaseFactor,
                'updated_at' => now()->format('Y-m-d H:i:s'),
            ],
        );
    }
}
