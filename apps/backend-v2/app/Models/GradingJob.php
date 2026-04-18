<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'submission_type', 'submission_id', 'status', 'attempts',
    'last_error', 'started_at', 'completed_at',
])]
class GradingJob extends BaseModel
{
    protected function casts(): array
    {
        return ['started_at' => 'datetime', 'completed_at' => 'datetime'];
    }
}
