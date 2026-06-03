<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;

interface ExamSessionResultInterface
{
    /** @return array<string, mixed> */
    public function get(ExamSession $session): array;
}
