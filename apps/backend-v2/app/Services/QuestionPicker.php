<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Level;
use App\Enums\Skill;
use App\Models\Question;
use App\Models\Submission;
use Illuminate\Support\Collection;

class QuestionPicker
{
    private const RECENT_EXCLUDE = 50;

    /**
     * Writing banks are sparse at lower levels, so we may relax the requested
     * part after exhausting same-part fallbacks. C1 keeps part strict.
     *
     * @var list<Level>
     */
    private const PART_RELAXABLE_LEVELS = [Level::A2, Level::B1, Level::B2];

    public function __construct(
        private readonly WeakPointService $weakPointService,
    ) {}

    public function pick(
        string $userId,
        Skill $skill,
        Level $baseLevel,
        int $currentIndex,
        int $totalItems,
        Collection $sessionQuestionIds,
        ?string $focusKp = null,
        ?string $topic = null,
        ?int $part = null,
    ): ?Question {
        $excludeIds = $this->buildExcludeIds($userId, $skill, $sessionQuestionIds);

        // Every 3rd item → try review from weak points (skip if learner chose a focus KP)
        if (! $focusKp && $currentIndex > 0 && $currentIndex % 3 === 0) {
            $review = $this->pickReviewItem($userId, $skill, $excludeIds, $topic, $part);
            if ($review) {
                return $review;
            }
        }

        $level = $this->resolveDifficulty($baseLevel, $currentIndex, $totalItems);

        foreach ($this->buildCandidates($skill, $baseLevel, $level, $excludeIds, $focusKp, $topic, $part) as $candidate) {
            $question = $this->findQuestion(
                $skill,
                $candidate['level'],
                $candidate['exclude_ids'],
                $candidate['focus_kp'],
                $candidate['topic'],
                $candidate['part'],
            );

            if ($question && ! $sessionQuestionIds->contains($question->id)) {
                return $question;
            }
        }

        return null;
    }

    public function resolveDifficulty(Level $baseLevel, int $index, int $total): Level
    {
        if ($index < 0 || $total <= 1) {
            return $baseLevel;
        }

        $ratio = $index / ($total - 1);

        return match (true) {
            $ratio < 0.3 => $baseLevel->prev() ?? $baseLevel,
            $ratio > 0.7 => $baseLevel->next() ?? $baseLevel,
            default => $baseLevel,
        };
    }

    private function pickReviewItem(string $userId, Skill $skill, Collection $excludeIds, ?string $topic = null, ?int $part = null): ?Question
    {
        $dueWp = $this->weakPointService->getDueForReview($userId, $skill, 1)->first();

        if (! $dueWp) {
            return null;
        }

        return Question::where('skill', $skill)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->when($topic, fn ($q, $value) => $q->where('topic', $value))
            ->when($part, fn ($q, $value) => $q->where('part', $value))
            ->whereHas('knowledgePoints', fn ($q) => $q->where('knowledge_points.id', $dueWp->knowledge_point_id))
            ->inRandomOrder()
            ->first();
    }

    /**
     * @return list<array{level: Level, exclude_ids: Collection<int, string>, focus_kp: ?string, topic: ?string, part: ?int}>
     */
    private function buildCandidates(
        Skill $skill,
        Level $baseLevel,
        Level $resolvedLevel,
        Collection $excludeIds,
        ?string $focusKp,
        ?string $topic,
        ?int $part,
    ): array {
        $candidates = [
            $this->candidate($resolvedLevel, $excludeIds, $focusKp, $topic, $part),
            $this->candidate($baseLevel, $excludeIds, $focusKp, $topic, $part),
            $this->candidate($baseLevel, $excludeIds, null, $topic, $part),
        ];

        foreach ($this->buildLevelRelaxationLevels($baseLevel, $part) as $relaxedLevel) {
            $candidates[] = $this->candidate($relaxedLevel, $excludeIds, null, $topic, $part);
        }

        if ($this->shouldRelaxPart($skill, $baseLevel, $part)) {
            $candidates[] = $this->candidate($baseLevel, $excludeIds, null, $topic, null);
        }

        return $this->uniqueCandidates($candidates);
    }

    /**
     * @return list<Level>
     */
    private function buildLevelRelaxationLevels(Level $baseLevel, ?int $part): array
    {
        if ($part === null) {
            return [];
        }

        $levels = [];
        $current = $baseLevel->next();

        while ($current !== null) {
            $levels[] = $current;
            $current = $current->next();
        }

        return $levels;
    }

    private function shouldRelaxPart(Skill $skill, Level $baseLevel, ?int $part): bool
    {
        return $skill === Skill::Writing
            && $part !== null
            && in_array($baseLevel, self::PART_RELAXABLE_LEVELS, true);
    }

    /**
     * @param  Collection<int, string>  $excludeIds
     * @return array{level: Level, exclude_ids: Collection<int, string>, focus_kp: ?string, topic: ?string, part: ?int}
     */
    private function candidate(Level $level, Collection $excludeIds, ?string $focusKp, ?string $topic, ?int $part): array
    {
        return [
            'level' => $level,
            'exclude_ids' => $excludeIds,
            'focus_kp' => $focusKp,
            'topic' => $topic,
            'part' => $part,
        ];
    }

    /**
     * @param  list<array{level: Level, exclude_ids: Collection<int, string>, focus_kp: ?string, topic: ?string, part: ?int}>  $candidates
     * @return list<array{level: Level, exclude_ids: Collection<int, string>, focus_kp: ?string, topic: ?string, part: ?int}>
     */
    private function uniqueCandidates(array $candidates): array
    {
        $unique = [];
        $seen = [];

        foreach ($candidates as $candidate) {
            $key = implode('|', [
                $candidate['level']->value,
                $candidate['exclude_ids']->isEmpty() ? 'no_exclude' : 'exclude',
                $candidate['focus_kp'] ?? 'no_focus',
                $candidate['topic'] ?? 'no_topic',
                $candidate['part'] !== null ? (string) $candidate['part'] : 'no_part',
            ]);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[] = $candidate;
        }

        return $unique;
    }

    private function findQuestion(Skill $skill, Level $level, Collection $excludeIds, ?string $focusKp = null, ?string $topic = null, ?int $part = null): ?Question
    {
        return Question::where('skill', $skill)
            ->where('level', $level)
            ->where('is_active', true)
            ->when($excludeIds->isNotEmpty(), fn ($q) => $q->whereNotIn('id', $excludeIds))
            ->when($focusKp, fn ($q, $v) => $q->whereHas('knowledgePoints', fn ($q) => $q->where('name', $v)))
            ->when($topic, fn ($q, $value) => $q->where('topic', $value))
            ->when($part, fn ($q, $value) => $q->where('part', $value))
            ->inRandomOrder()
            ->first();
    }

    private function buildExcludeIds(string $userId, Skill $skill, Collection $sessionQuestionIds): Collection
    {
        $recentIds = Submission::forUser($userId)
            ->where('skill', $skill)
            ->orderByDesc('created_at')
            ->limit(self::RECENT_EXCLUDE)
            ->pluck('question_id');

        return $sessionQuestionIds->merge($recentIds)->unique();
    }
}
