<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\Profile;

interface ExamOverviewInterface
{
    /** @return array<string, mixed> */
    public function show(Profile $profile, string $examId): array;
}
