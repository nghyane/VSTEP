<?php

declare(strict_types=1);

namespace App\Srs;

/**
 * Combined scheduling + memory state.
 *
 * Scheduling: kind + remaining_steps (Anki learning steps)
 * Memory: difficulty + stability (FSRS)
 *
 * kind:
 * - new: never reviewed (d=0, s=0)
 * - learning: going through learning steps
 * - review: graduated, FSRS schedules interval
 * - relearning: review failed, going through relearning steps
 */
final class FsrsState
{
    public function __construct(
        public readonly string $kind = 'new',
        public readonly float $difficulty = 0.0,
        public readonly float $stability = 0.0,
        public readonly int $lapses = 0,
        public readonly int $remainingSteps = 0,
        public readonly ?int $dueAtMs = null,
        public readonly ?int $lastReviewAtMs = null,
    ) {}

    public static function new(): self
    {
        return new self;
    }

    public function isNew(): bool
    {
        return $this->kind === 'new';
    }

    public function isLearning(): bool
    {
        return $this->kind === 'learning' || $this->kind === 'relearning';
    }

    public function isReview(): bool
    {
        return $this->kind === 'review';
    }

    /**
     * Retrievability at a given timestamp.
     */
    public function retrievability(FsrsConfig $config, ?int $nowMs = null): float
    {
        if ($this->stability <= 0 || $this->lastReviewAtMs === null) {
            return 0.0;
        }

        $nowMs ??= (int) (microtime(true) * 1000);
        $elapsedDays = max(0, ($nowMs - $this->lastReviewAtMs) / 86_400_000);
        $decay = -$config->w[20];
        $factor = exp(log(0.9) / $decay) - 1;

        return ($elapsedDays / $this->stability * $factor + 1) ** $decay;
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(FsrsConfig $config, ?int $nowMs = null): array
    {
        return [
            'kind' => $this->kind,
            'difficulty' => round($this->difficulty, 4),
            'stability' => round($this->stability, 4),
            'retrievability' => round($this->retrievability($config, $nowMs), 4),
            'lapses' => $this->lapses,
        ];
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            kind: (string) ($data['kind'] ?? 'new'),
            difficulty: (float) ($data['difficulty'] ?? 0.0),
            stability: (float) ($data['stability'] ?? 0.0),
            lapses: (int) ($data['lapses'] ?? 0),
            remainingSteps: (int) ($data['remaining_steps'] ?? 0),
            dueAtMs: isset($data['due_at_ms']) ? (int) $data['due_at_ms'] : null,
            lastReviewAtMs: isset($data['last_review_at_ms']) ? (int) $data['last_review_at_ms'] : null,
        );
    }
}
