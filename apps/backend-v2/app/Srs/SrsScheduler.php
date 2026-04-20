<?php

declare(strict_types=1);

namespace App\Srs;

use App\Enums\SrsStateKind;

/**
 * SRS scheduler — PHP port của FE Anki-style scheduler.
 * Reference: apps/frontend-v2/src/lib/srs/scheduler.ts
 *
 * Rating:
 * - 1 = Again
 * - 2 = Hard
 * - 3 = Good
 * - 4 = Easy
 *
 * Pure function: nextState($state, $rating, $config, $nowMs) → SrsCardState.
 * Không đụng storage — service layer chịu trách nhiệm persist.
 */
final class SrsScheduler
{
    private const MS_PER_MINUTE = 60_000;

    private const MS_PER_DAY = 86_400_000;

    public function __construct(
        private readonly SrsConfig $config,
    ) {}

    public function nextState(SrsCardState $state, int $rating, int $nowMs): SrsCardState
    {
        $this->assertValidRating($rating);

        return match ($state->kind) {
            SrsStateKind::New => $this->applyLearning(
                SrsCardState::learning(
                    remainingSteps: count($this->config->learningSteps),
                    dueAtMs: $nowMs,
                ),
                $rating,
                $nowMs,
                $this->config->learningSteps,
                null,
            ),
            SrsStateKind::Learning => $this->applyLearning(
                $state,
                $rating,
                $nowMs,
                $this->config->learningSteps,
                null,
            ),
            SrsStateKind::Review => $this->applyReview($state, $rating, $nowMs),
            SrsStateKind::Relearning => $this->applyLearning(
                SrsCardState::learning(
                    remainingSteps: $state->remainingSteps ?? count($this->config->relearningSteps),
                    dueAtMs: $state->dueAtMs ?? $nowMs,
                ),
                $rating,
                $nowMs,
                $this->config->relearningSteps,
                [
                    'interval_days' => $state->reviewIntervalDays ?? 0,
                    'ease_factor' => $state->reviewEaseFactor ?? $this->config->initialEaseFactor,
                    'lapses' => $state->lapses,
                ],
            ),
        };
    }

    /**
     * @param  array<int,int>  $steps
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function applyLearning(
        SrsCardState $state,
        int $rating,
        int $nowMs,
        array $steps,
        ?array $reviewReturn,
    ): SrsCardState {
        if ($rating === 4) {
            return $this->graduateEasy($nowMs, $reviewReturn);
        }

        if ($rating === 1) {
            return $this->learningAgain($steps, $nowMs);
        }

        if ($rating === 2) {
            return $this->learningHard($state, $steps, $nowMs, $reviewReturn);
        }

        return $this->learningGood($state, $steps, $nowMs, $reviewReturn);
    }

    /**
     * @param  array<int,int>  $steps
     */
    private function learningAgain(array $steps, int $nowMs): SrsCardState
    {
        $firstStep = $steps[0] ?? 1;

        return SrsCardState::learning(
            remainingSteps: count($steps),
            dueAtMs: $nowMs + $firstStep * self::MS_PER_MINUTE,
        );
    }

    /**
     * @param  array<int,int>  $steps
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function learningHard(
        SrsCardState $state,
        array $steps,
        int $nowMs,
        ?array $reviewReturn,
    ): SrsCardState {
        $remaining = $state->remainingSteps ?? count($steps);
        $idx = $this->stepIndex($remaining, count($steps));
        $currentStep = $steps[$idx] ?? 1;

        if ($idx === 0) {
            $nextStep = $steps[1] ?? null;
            $delayMinutes = $nextStep !== null
                ? ($currentStep + $nextStep) / 2
                : $currentStep * 1.5;
        } else {
            $delayMinutes = (float) $currentStep;
        }

        $dueAt = $nowMs + (int) round($delayMinutes * self::MS_PER_MINUTE);

        return $this->rebuildLearning($remaining, $dueAt, $reviewReturn);
    }

    /**
     * @param  array<int,int>  $steps
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function learningGood(
        SrsCardState $state,
        array $steps,
        int $nowMs,
        ?array $reviewReturn,
    ): SrsCardState {
        $newRemaining = ($state->remainingSteps ?? count($steps)) - 1;
        if ($newRemaining <= 0) {
            return $this->graduateGood($nowMs, $reviewReturn);
        }

        $idx = $this->stepIndex($newRemaining, count($steps));
        $nextStep = $steps[$idx] ?? 1;
        $dueAt = $nowMs + $nextStep * self::MS_PER_MINUTE;

        return $this->rebuildLearning($newRemaining, $dueAt, $reviewReturn);
    }

    /**
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function rebuildLearning(int $remaining, int $dueAtMs, ?array $reviewReturn): SrsCardState
    {
        if ($reviewReturn !== null) {
            return SrsCardState::relearning(
                remainingSteps: $remaining,
                dueAtMs: $dueAtMs,
                reviewIntervalDays: $reviewReturn['interval_days'],
                reviewEaseFactor: $reviewReturn['ease_factor'],
                lapses: $reviewReturn['lapses'],
            );
        }

        return SrsCardState::learning(remainingSteps: $remaining, dueAtMs: $dueAtMs);
    }

    /**
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function graduateGood(int $nowMs, ?array $reviewReturn): SrsCardState
    {
        if ($reviewReturn !== null) {
            $interval = max($reviewReturn['interval_days'], $this->config->minLapseIntervalDays);

            return SrsCardState::review(
                intervalDays: $interval,
                easeFactor: $reviewReturn['ease_factor'],
                lapses: $reviewReturn['lapses'],
                dueAtMs: $nowMs + $interval * self::MS_PER_DAY,
            );
        }

        return SrsCardState::review(
            intervalDays: $this->config->graduatingIntervalGood,
            easeFactor: $this->config->initialEaseFactor,
            lapses: 0,
            dueAtMs: $nowMs + $this->config->graduatingIntervalGood * self::MS_PER_DAY,
        );
    }

    /**
     * @param  array{interval_days:int,ease_factor:float,lapses:int}|null  $reviewReturn
     */
    private function graduateEasy(int $nowMs, ?array $reviewReturn): SrsCardState
    {
        if ($reviewReturn !== null) {
            $interval = $reviewReturn['interval_days'] + 1;

            return SrsCardState::review(
                intervalDays: $interval,
                easeFactor: $reviewReturn['ease_factor'],
                lapses: $reviewReturn['lapses'],
                dueAtMs: $nowMs + $interval * self::MS_PER_DAY,
            );
        }

        return SrsCardState::review(
            intervalDays: $this->config->graduatingIntervalEasy,
            easeFactor: $this->config->initialEaseFactor,
            lapses: 0,
            dueAtMs: $nowMs + $this->config->graduatingIntervalEasy * self::MS_PER_DAY,
        );
    }

    private function applyReview(SrsCardState $state, int $rating, int $nowMs): SrsCardState
    {
        if ($rating === 1) {
            return $this->reviewAgain($state, $nowMs);
        }

        $current = max($state->intervalDays ?? 1, 1);
        $daysLate = max(0, (int) floor(($nowMs - ($state->dueAtMs ?? $nowMs)) / self::MS_PER_DAY));
        $ease = $state->easeFactor ?? $this->config->initialEaseFactor;

        if ($rating === 2) {
            $interval = $this->clampInterval($current * $this->config->hardMultiplier, $current + 1);

            return $this->buildReviewState(
                $interval,
                $ease + $this->config->easeDeltaHard,
                $state->lapses,
                $nowMs,
            );
        }

        if ($rating === 3) {
            $hardInterval = $current * $this->config->hardMultiplier;
            $interval = $this->clampInterval(
                ($current + $daysLate / 2) * $ease,
                (int) $hardInterval + 1,
            );

            return $this->buildReviewState($interval, $ease, $state->lapses, $nowMs);
        }

        // Easy
        $goodInterval = ($current + $daysLate / 2) * $ease;
        $interval = $this->clampInterval(
            ($current + $daysLate) * $ease * $this->config->easyMultiplier,
            (int) $goodInterval + 1,
        );

        return $this->buildReviewState(
            $interval,
            $ease + $this->config->easeDeltaEasy,
            $state->lapses,
            $nowMs,
        );
    }

    private function reviewAgain(SrsCardState $state, int $nowMs): SrsCardState
    {
        $lapses = $state->lapses + 1;
        $failingInterval = max(
            (int) round(($state->intervalDays ?? 1) * $this->config->lapseMultiplier),
            $this->config->minLapseIntervalDays,
        );
        $newEase = max(
            $this->config->minEaseFactor,
            ($state->easeFactor ?? $this->config->initialEaseFactor) + $this->config->easeDeltaAgain,
        );

        if (count($this->config->relearningSteps) > 0) {
            $firstStep = $this->config->relearningSteps[0] ?? 10;

            return SrsCardState::relearning(
                remainingSteps: count($this->config->relearningSteps),
                dueAtMs: $nowMs + $firstStep * self::MS_PER_MINUTE,
                reviewIntervalDays: $failingInterval,
                reviewEaseFactor: $newEase,
                lapses: $lapses,
            );
        }

        return SrsCardState::review(
            intervalDays: $failingInterval,
            easeFactor: $newEase,
            lapses: $lapses,
            dueAtMs: $nowMs + $failingInterval * self::MS_PER_DAY,
        );
    }

    private function buildReviewState(int $intervalDays, float $easeFactor, int $lapses, int $nowMs): SrsCardState
    {
        $clampedEase = max($this->config->minEaseFactor, $easeFactor);

        return SrsCardState::review(
            intervalDays: $intervalDays,
            easeFactor: $clampedEase,
            lapses: $lapses,
            dueAtMs: $nowMs + $intervalDays * self::MS_PER_DAY,
        );
    }

    private function stepIndex(int $remaining, int $totalSteps): int
    {
        return max(0, $totalSteps - $remaining);
    }

    private function clampInterval(float $raw, int $minimum): int
    {
        $adjusted = $raw * $this->config->intervalMultiplier;

        return max($minimum, min($this->config->maxReviewIntervalDays, (int) round($adjusted)));
    }

    private function assertValidRating(int $rating): void
    {
        if ($rating < 1 || $rating > 4) {
            throw new \InvalidArgumentException("Rating must be 1-4, got {$rating}.");
        }
    }
}
