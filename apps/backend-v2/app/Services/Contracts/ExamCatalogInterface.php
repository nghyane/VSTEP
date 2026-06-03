<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\Profile;
use Illuminate\Pagination\LengthAwarePaginator;

interface ExamCatalogInterface
{
    /**
     * @param  array{q?: string, status?: string, sort?: string}  $filters
     */
    public function listForProfile(Profile $profile, array $filters = [], int $perPage = 12): LengthAwarePaginator;
}
