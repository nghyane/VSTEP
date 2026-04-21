<?php

declare(strict_types=1);

namespace App\Srs;

/**
 * FSRS v6 scheduler with Anki-style learning steps.
 *
 * Two layers (like Anki):
 * - Scheduling: learning steps control intraday reviews
 * - Memory: FSRS computes difficulty + stability
 *
 * Flow:
 * new → learning (steps) → review (FSRS interval)
 * review + Again → relearning (steps) → review (FSRS interval)
 */
final class FsrsScheduler
{
    private const MS_PER_MINUTE = 60_000;

    private const MS_PER_DAY = 86_400_000;

    private const D_MIN = 1.0;

    private const D_MAX = 10.0;

    private const S_MIN = 0.001;

    private const S_MAX = 36500.0;

    public function __construct(
        private readonly FsrsConfig $config,
    ) {}

    public function schedule(FsrsState $state, int $rating, int $nowMs): FsrsState
    {
        $this->assertValidRating($rating);
        $w = $this->config->w;

        // FSRS memory update (always computed)
        $memory = $this->nextMemory($state, $rating, $nowMs, $w);

        // Scheduling layer (learning steps)
        return match ($state->kind) {
            'new' => $this->scheduleFromNew($memory, $rating, $nowMs),
            'learning' => $this->scheduleFromLearning($state, $memory, $rating, $nowMs, $this->config->learningSteps),
            'review' => $this->scheduleFromReview($state, $memory, $rating, $nowMs),
            'relearning' => $this->scheduleFromLearning($state, $memory, $rating, $nowMs, $this->config->relearningSteps),
            default => $this->scheduleFromNew($memory, $rating, $nowMs),
        };
    }

    /**
     * @param  array{d: float, s: float}  $memory
     */
    private function scheduleFromNew(array $memory, int $rating, int $nowMs): FsrsState
    {
        $steps = $this->config->learningSteps;

        if ($rating === 4 || count($steps) === 0) {
            // Easy or no steps → graduate immediately
            return $this->graduate($memory, $rating === 1 ? 1 : 0, $nowMs);
        }

        // Enter learning
        $stepIndex = $rating === 1 ? 0 : min($rating - 2, count($steps) - 1);
        $delayMs = ($steps[$stepIndex] ?? $steps[0]) * self::MS_PER_MINUTE;

        return new FsrsState(
            kind: 'learning',
            difficulty: $memory['d'],
            stability: $memory['s'],
            lapses: $rating === 1 ? 1 : 0,
            remainingSteps: count($steps) - $stepIndex,
            dueAtMs: $nowMs + $delayMs,
            lastReviewAtMs: $nowMs,
        );
    }

    /**
     * @param  array{d: float, s: float}  $memory
     * @param  array<int,int>  $steps
     */
    private function scheduleFromLearning(FsrsState $state, array $memory, int $rating, int $nowMs, array $steps): FsrsState
    {
        $kind = $state->kind;

        if ($rating === 4) {
            // Easy → graduate immediately
            return $this->graduate($memory, $state->lapses, $nowMs);
        }

        if ($rating === 1) {
            // Again → reset to first step
            $delayMs = ($steps[0] ?? 1) * self::MS_PER_MINUTE;

            return new FsrsState(
                kind: $kind,
                difficulty: $memory['d'],
                stability: $memory['s'],
                lapses: $kind === 'relearning' ? $state->lapses : $state->lapses,
                remainingSteps: count($steps),
                dueAtMs: $nowMs + $delayMs,
                lastReviewAtMs: $nowMs,
            );
        }

        // Hard (2) or Good (3) → advance step
        $newRemaining = $rating === 3
            ? $state->remainingSteps - 1
            : $state->remainingSteps; // Hard stays on same step

        if ($newRemaining <= 0) {
            // All steps done → graduate
            return $this->graduate($memory, $state->lapses, $nowMs);
        }

        $stepIndex = count($steps) - $newRemaining;
        $delayMs = ($steps[$stepIndex] ?? $steps[0]) * self::MS_PER_MINUTE;

        return new FsrsState(
            kind: $kind,
            difficulty: $memory['d'],
            stability: $memory['s'],
            lapses: $state->lapses,
            remainingSteps: $newRemaining,
            dueAtMs: $nowMs + $delayMs,
            lastReviewAtMs: $nowMs,
        );
    }

    /**
     * @param  array{d: float, s: float}  $memory
     */
    private function scheduleFromReview(FsrsState $state, array $memory, int $rating, int $nowMs): FsrsState
    {
        if ($rating === 1) {
            // Again → enter relearning
            $steps = $this->config->relearningSteps;
            if (count($steps) === 0) {
                // No relearning steps → stay in review with FSRS interval
                return $this->graduate($memory, $state->lapses + 1, $nowMs);
            }

            $delayMs = ($steps[0] ?? 10) * self::MS_PER_MINUTE;

            return new FsrsState(
                kind: 'relearning',
                difficulty: $memory['d'],
                stability: $memory['s'],
                lapses: $state->lapses + 1,
                remainingSteps: count($steps),
                dueAtMs: $nowMs + $delayMs,
                lastReviewAtMs: $nowMs,
            );
        }

        // Hard/Good/Easy → FSRS interval
        $interval = $this->nextInterval($memory['s']);

        return new FsrsState(
            kind: 'review',
            difficulty: $memory['d'],
            stability: $memory['s'],
            lapses: $state->lapses,
            remainingSteps: 0,
            dueAtMs: $nowMs + $interval * self::MS_PER_DAY,
            lastReviewAtMs: $nowMs,
        );
    }

    /**
     * @param  array{d: float, s: float}  $memory
     */
    private function graduate(array $memory, int $lapses, int $nowMs): FsrsState
    {
        $interval = $this->nextInterval($memory['s']);

        return new FsrsState(
            kind: 'review',
            difficulty: $memory['d'],
            stability: $memory['s'],
            lapses: $lapses,
            remainingSteps: 0,
            dueAtMs: $nowMs + $interval * self::MS_PER_DAY,
            lastReviewAtMs: $nowMs,
        );
    }

    // ─── FSRS Memory Layer ───

    /**
     * @param  array<int,float>  $w
     * @return array{d: float, s: float}
     */
    private function nextMemory(FsrsState $state, int $rating, int $nowMs, array $w): array
    {
        if ($state->isNew()) {
            return [
                'd' => $this->clampD($w[4] - exp(($rating - 1) * $w[5]) + 1),
                's' => $this->clampS($w[$rating - 1]),
            ];
        }

        $lastD = $this->clampD($state->difficulty);
        $lastS = $this->clampS($state->stability);

        $elapsedDays = $state->lastReviewAtMs !== null
            ? max(0, ($nowMs - $state->lastReviewAtMs) / self::MS_PER_DAY)
            : 0;

        $r = $this->retrievability($elapsedDays, $lastS, $w[20]);

        // Next difficulty
        $deltaD = -$w[6] * ($rating - 3);
        $linearDamped = (10 - $lastD) / 9 * $deltaD;
        $initD4 = $this->clampD($w[4] - exp(3 * $w[5]) + 1);
        $newD = $this->clampD($w[7] * ($initD4 - ($lastD + $linearDamped)) + ($lastD + $linearDamped));

        // Next stability
        if ($rating === 1) {
            $newS = $w[11] * ($lastD ** (-$w[12])) * (($lastS + 1) ** $w[13] - 1) * exp($w[14] * (1 - $r));
            $sMin = $lastS / exp($w[17] * $w[18]);
            $newS = max($sMin, $newS);
        } elseif ($elapsedDays == 0) {
            $sinc = exp($w[17] * ($rating - 3 + $w[18])) * ($lastS ** (-$w[19]));
            if ($rating >= 2) {
                $sinc = max(1.0, $sinc);
            }
            $newS = $lastS * $sinc;
        } else {
            $hardPenalty = $rating === 2 ? $w[15] : 1.0;
            $easyBonus = $rating === 4 ? $w[16] : 1.0;
            $newS = $lastS * (exp($w[8]) * (11 - $lastD) * ($lastS ** (-$w[9]))
                * (exp($w[10] * (1 - $r)) - 1) * $hardPenalty * $easyBonus + 1);
        }

        return ['d' => $newD, 's' => $this->clampS($newS)];
    }

    private function retrievability(float $elapsedDays, float $stability, float $w20): float
    {
        $decay = -$w20;
        $factor = exp(log(0.9) / $decay) - 1;

        return ($elapsedDays / $stability * $factor + 1) ** $decay;
    }

    private function nextInterval(float $stability): int
    {
        $decay = -$this->config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;
        $r = $this->config->desiredRetention;
        $interval = $stability / $factor * ($r ** (1.0 / $decay) - 1);

        return max(1, min($this->config->maxInterval, (int) round($interval)));
    }

    private function clampD(float $d): float
    {
        return max(self::D_MIN, min(self::D_MAX, $d));
    }

    private function clampS(float $s): float
    {
        return max(self::S_MIN, min(self::S_MAX, $s));
    }

    private function assertValidRating(int $rating): void
    {
        if ($rating < 1 || $rating > 4) {
            throw new \InvalidArgumentException("Rating must be 1-4, got {$rating}.");
        }
    }
}
