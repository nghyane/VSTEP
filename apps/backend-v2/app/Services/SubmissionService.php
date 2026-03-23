<?php

namespace App\Services;

use App\Models\Submission;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SubmissionService
{
    public function list(string $userId, array $params, bool $adminView = false): LengthAwarePaginator
    {
        $query = Submission::query();

        if (!$adminView) {
            $query->where('user_id', $userId);
        }

        if ($skill = $params['skill'] ?? null) {
            $query->where('skill', $skill);
        }

        if ($status = $params['status'] ?? null) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('created_at')->paginate($params['limit'] ?? 20);
    }

    public function find(string $id, string $userId, bool $adminView = false): Submission
    {
        $query = Submission::query();

        if (!$adminView) {
            $query->where('user_id', $userId);
        }

        return $query->findOrFail($id);
    }
}
