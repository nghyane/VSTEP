<?php

declare(strict_types=1);

namespace App\Services\Exam\Results;

final class ExamResultReadModelStatus
{
    public const READY = 'ready';

    public const PENDING = 'pending';

    public const PARTIAL = 'partial';

    public const NOT_SUBMITTED = 'not_submitted';

    public const NOT_APPLICABLE = 'not_applicable';

    public const NONE = 'none';

    public const FAILED = 'failed';
}
