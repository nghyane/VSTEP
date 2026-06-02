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
use App\Services\Contracts\LearningPathInterface;
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
final class VocabService
{
    private const LEVEL_ORDER = ['A1' => 0, 'A2' => 1, 'B1' => 2, 'B2' => 3, 'C1' => 4];

    public function __construct(
        private readonly FsrsScheduler $scheduler,
        private readonly FsrsConfig $config,
        private readonly LearningPathInterface $learningPath,
    ) {}

    /**
     * @return Collection<int,VocabTopic>
     */
    public function listPublishedTopics(Profile $profile): Collection
    {
        $topics = VocabTopic::query()
            ->where('is_published', true)
            ->withCount('words')
            ->withCount(['words as learned_count' => function ($q) use ($profile) {
                $q->whereHas('srsStates', fn ($sq) => $sq->where('profile_id', $profile->id));
            }])
            ->orderBy('level')
            ->orderBy('display_order')
            ->get();

        $this->annotateAdaptiveRecommendations($topics, $profile);

        return $topics;
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

        // 2. Learning cards due within learn-ahead window
        $learnAhead = ProfileVocabSrsState::query()
            ->where('profile_id', $profile->id)
            ->where('due_at', '>', $now)
            ->where('due_at', '<=', $learnAheadCutoff)
            ->whereIn('state_kind', ['learning', 'relearning'])
            ->orderBy('due_at')
            ->limit($limit)
            ->get();

        // concat() not merge() — model has null primaryKey, merge() deduplicates by key
        $allStates = $dueNow->concat($learnAhead)->unique('word_id')->take($limit);
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

    /**
     * @param  Collection<int,VocabTopic>  $topics
     */
    private function annotateAdaptiveRecommendations(Collection $topics, Profile $profile): void
    {
        $path = $this->learningPath->forProfile($profile);
        $activeLevel = $this->normalizeLevel($path['current_level']) ?? $this->normalizeLevel($path['target_level']);

        $topics->groupBy(fn (VocabTopic $topic): string => $topic->group_key)
            ->each(function (Collection $group) use ($activeLevel): void {
                /** @var Collection<int,VocabTopic> $group */
                $recommendation = $this->recommendTopic($group, $activeLevel);

                $group->each(function (VocabTopic $topic) use ($recommendation): void {
                    $topic->setAttribute('recommended_topic_id', $recommendation['topic']->id);
                    $topic->setAttribute('adaptive_reason', $recommendation['reason']);
                    $topic->setAttribute('adaptive_label', $recommendation['label']);
                });
            });
    }

    /**
     * @param  Collection<int,VocabTopic>  $topics
     * @return array{topic: VocabTopic, reason: string, label: string}
     */
    private function recommendTopic(Collection $topics, ?string $activeLevel): array
    {
        $ordered = $topics
            ->sortBy(fn (VocabTopic $topic): array => [$this->levelRank($topic->level), $topic->display_order])
            ->values();

        $inProgress = $ordered->first(
            fn (VocabTopic $topic): bool => $this->learnedCount($topic) > 0
                && $this->learnedCount($topic) < $this->wordCount($topic),
        );
        if ($inProgress instanceof VocabTopic) {
            return ['topic' => $inProgress, 'reason' => 'continue', 'label' => 'Tiếp tục'];
        }

        if ($activeLevel !== null) {
            $nearActive = $this->nearestIncompleteTopic($ordered, $activeLevel);
            if ($nearActive instanceof VocabTopic) {
                $reason = $this->levelRank($nearActive->level) < $this->levelRank($activeLevel) ? 'catch_up' : 'recommended';

                return [
                    'topic' => $nearActive,
                    'reason' => $reason,
                    'label' => $reason === 'catch_up' ? 'Còn lại' : 'Đề xuất',
                ];
            }
        }

        $firstIncomplete = $ordered->first(
            fn (VocabTopic $topic): bool => $this->wordCount($topic) > 0
                && $this->learnedCount($topic) < $this->wordCount($topic),
        );
        if ($firstIncomplete instanceof VocabTopic) {
            return ['topic' => $firstIncomplete, 'reason' => 'first_incomplete', 'label' => 'Đề xuất'];
        }

        $activeTopic = $activeLevel !== null
            ? $ordered->first(fn (VocabTopic $topic): bool => $this->normalizeLevel($topic->level) === $activeLevel)
            : null;
        if ($activeTopic instanceof VocabTopic) {
            return ['topic' => $activeTopic, 'reason' => 'review', 'label' => 'Hoàn thành chủ đề'];
        }

        /** @var VocabTopic $fallback */
        $fallback = $ordered->first();

        return ['topic' => $fallback, 'reason' => 'review', 'label' => 'Hoàn thành chủ đề'];
    }

    /**
     * @param  Collection<int,VocabTopic>  $topics
     */
    private function nearestIncompleteTopic(Collection $topics, string $activeLevel): ?VocabTopic
    {
        $levels = array_keys(self::LEVEL_ORDER);
        $activeLevelIndex = array_search($activeLevel, $levels, true);
        if ($activeLevelIndex === false) {
            return null;
        }

        $searchLevels = array_merge(
            [$activeLevel],
            array_slice($levels, $activeLevelIndex + 1),
            array_reverse(array_slice($levels, 0, $activeLevelIndex)),
        );

        foreach ($searchLevels as $level) {
            $topic = $topics->first(
                fn (VocabTopic $item): bool => $this->normalizeLevel($item->level) === $level
                    && $this->wordCount($item) > 0
                    && $this->learnedCount($item) < $this->wordCount($item),
            );
            if ($topic instanceof VocabTopic) {
                return $topic;
            }
        }

        return null;
    }

    private function normalizeLevel(?string $level): ?string
    {
        $normalized = strtoupper((string) $level);

        return array_key_exists($normalized, self::LEVEL_ORDER) ? $normalized : null;
    }

    private function levelRank(?string $level): int
    {
        $normalized = $this->normalizeLevel($level);

        return $normalized !== null ? self::LEVEL_ORDER[$normalized] : count(self::LEVEL_ORDER);
    }

    private function wordCount(VocabTopic $topic): int
    {
        return (int) ($topic->getAttribute('words_count') ?? 0);
    }

    private function learnedCount(VocabTopic $topic): int
    {
        return (int) ($topic->getAttribute('learned_count') ?? 0);
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
