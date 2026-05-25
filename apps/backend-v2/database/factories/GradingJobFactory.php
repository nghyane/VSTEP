<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\GradingJobStatus;
use App\Models\GradingJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GradingJob> */
class GradingJobFactory extends Factory
{
    protected $model = GradingJob::class;

    public function definition(): array
    {
        return [
            'submission_type' => 'practice_writing',
            'submission_id' => $this->faker->uuid(),
            'status' => GradingJobStatus::Pending,
            'attempts' => 0,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => GradingJobStatus::Failed,
            'attempts' => 3,
            'last_error' => 'Simulated failure',
        ]);
    }

    public function ready(): static
    {
        return $this->state(fn () => [
            'status' => GradingJobStatus::Ready,
            'attempts' => 1,
            'completed_at' => now(),
        ]);
    }
}
