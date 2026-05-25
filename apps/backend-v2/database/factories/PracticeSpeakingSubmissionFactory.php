<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\PracticeSession;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PracticeSpeakingSubmission> */
class PracticeSpeakingSubmissionFactory extends Factory
{
    protected $model = PracticeSpeakingSubmission::class;

    public function definition(): array
    {
        return [
            'session_id' => PracticeSession::factory(),
            'profile_id' => Profile::factory(),
            'task_ref_type' => 'practice_speaking_task',
            'task_ref_id' => PracticeSpeakingTask::factory(),
            'audio_url' => 'r2://test-audio-'.uniqid().'.webm',
            'duration_seconds' => 30,
            'submitted_at' => now(),
        ];
    }
}
