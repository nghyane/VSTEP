<?php

declare(strict_types=1);

namespace App\Srs;

use App\Enums\SrsStateKind;

/**
 * Value object cho SRS card state. Snapshot immutable.
 * Port trực tiếp từ FE src/lib/srs/types.ts.
 *
 * Non-applicable fields là null theo kind:
 * - new: tất cả null trừ dueAt (optional)
 * - learning: remainingSteps, dueAt
 * - review: intervalDays, easeFactor, lapses, dueAt
 * - relearning: remainingSteps, dueAt, reviewIntervalDays, reviewEaseFactor, lapses
 */
final class SrsCardState
{
    public function __construct(
        public readonly SrsStateKind $kind,
        public readonly ?int $dueAtMs = null,
        public readonly ?int $remainingSteps = null,
        public readonly ?int $intervalDays = null,
        public readonly ?float $easeFactor = null,
        public readonly int $lapses = 0,
        public readonly ?int $reviewIntervalDays = null,
        public readonly ?float $reviewEaseFactor = null,
    ) {}

    public static function new(): self
    {
        return new self(SrsStateKind::New);
    }

    public static function learning(int $remainingSteps, int $dueAtMs): self
    {
        return new self(SrsStateKind::Learning, dueAtMs: $dueAtMs, remainingSteps: $remainingSteps);
    }

    public static function review(int $intervalDays, float $easeFactor, int $lapses, int $dueAtMs): self
    {
        return new self(
            SrsStateKind::Review,
            dueAtMs: $dueAtMs,
            intervalDays: $intervalDays,
            easeFactor: $easeFactor,
            lapses: $lapses,
        );
    }

    public static function relearning(
        int $remainingSteps,
        int $dueAtMs,
        int $reviewIntervalDays,
        float $reviewEaseFactor,
        int $lapses,
    ): self {
        return new self(
            SrsStateKind::Relearning,
            dueAtMs: $dueAtMs,
            remainingSteps: $remainingSteps,
            reviewIntervalDays: $reviewIntervalDays,
            reviewEaseFactor: $reviewEaseFactor,
            lapses: $lapses,
        );
    }

    /**
     * @return array<string,mixed>
     */
    public function toArray(): array
    {
        return [
            'kind' => $this->kind->value,
            'due_at_ms' => $this->dueAtMs,
            'remaining_steps' => $this->remainingSteps,
            'interval_days' => $this->intervalDays,
            'ease_factor' => $this->easeFactor,
            'lapses' => $this->lapses,
            'review_interval_days' => $this->reviewIntervalDays,
            'review_ease_factor' => $this->reviewEaseFactor,
        ];
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $kind = SrsStateKind::from((string) $data['kind']);

        return new self(
            kind: $kind,
            dueAtMs: isset($data['due_at_ms']) ? (int) $data['due_at_ms'] : null,
            remainingSteps: isset($data['remaining_steps']) ? (int) $data['remaining_steps'] : null,
            intervalDays: isset($data['interval_days']) ? (int) $data['interval_days'] : null,
            easeFactor: isset($data['ease_factor']) ? (float) $data['ease_factor'] : null,
            lapses: (int) ($data['lapses'] ?? 0),
            reviewIntervalDays: isset($data['review_interval_days']) ? (int) $data['review_interval_days'] : null,
            reviewEaseFactor: isset($data['review_ease_factor']) ? (float) $data['review_ease_factor'] : null,
        );
    }
}
