<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Exam;
use App\Models\ExamVersion;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ExamVersion> */
class ExamVersionFactory extends Factory
{
    protected $model = ExamVersion::class;

    public function definition(): array
    {
        return [
            'exam_id' => Exam::factory(),
            'version_number' => 1,
            'is_active' => true,
        ];
    }
}
