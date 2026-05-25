<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ExamSessionStatus;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ExamSession> */
class ExamSessionFactory extends Factory
{
    protected $model = ExamSession::class;

    public function definition(): array
    {
        return [
            'exam_version_id' => ExamVersion::factory(),
            'profile_id' => Profile::factory(),
            'status' => ExamSessionStatus::Active,
            'started_at' => now(),
            'server_deadline_at' => now()->addHours(2),
        ];
    }
}
