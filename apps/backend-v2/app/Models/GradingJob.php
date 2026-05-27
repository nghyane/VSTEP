<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\GradingJobStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'submission_type', 'submission_id', 'status', 'attempts',
    'last_error', 'started_at', 'completed_at', 'progress',
])]
class GradingJob extends BaseModel
{
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'status' => GradingJobStatus::class,
            'progress' => 'array',
        ];
    }

    /**
     * Append a progress step. Persisted to DB and broadcast to cache for SSE.
     */
    public function addProgress(string $step, array $meta = []): void
    {
        $entry = ['step' => $step, 'at' => now()->toIso8601String(), ...$meta];

        $steps = $this->progress ?? [];
        $steps[] = $entry;

        // Write directly to avoid cast interference + refresh model state
        \DB::table('grading_jobs')->where('id', $this->id)->update([
            'progress' => json_encode($steps),
            'updated_at' => now(),
        ]);
        $this->progress = $steps;
    }
}
