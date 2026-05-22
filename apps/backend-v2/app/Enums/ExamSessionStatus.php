<?php

declare(strict_types=1);

namespace App\Enums;

enum ExamSessionStatus: string
{
    case Active = 'active';
    case Submitted = 'submitted';
    case AutoSubmitted = 'auto_submitted';
    case Grading = 'grading';
    case Graded = 'graded';

    /**
     * Statuses representing a finished exam (submitted by user or system).
     *
     * @return list<self>
     */
    public static function terminalStatuses(): array
    {
        return [self::Submitted, self::AutoSubmitted, self::Grading, self::Graded];
    }

    /**
     * Statuses that count as "attempted" for display/analytics.
     *
     * @return list<self>
     */
    public static function countableStatuses(): array
    {
        return [self::Submitted, self::Graded, self::AutoSubmitted];
    }

    /**
     * @return list<string>
     */
    public static function terminalValues(): array
    {
        return array_map(fn (self $s) => $s->value, self::terminalStatuses());
    }

    /**
     * @return list<string>
     */
    public static function countableValues(): array
    {
        return array_map(fn (self $s) => $s->value, self::countableStatuses());
    }

    public function isTerminal(): bool
    {
        return in_array($this, self::terminalStatuses(), true);
    }
}
