<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakState;
use App\Models\WritingGradingResult;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed dashboard demo data: streak, activity heatmap, exam sessions with grading.
 * Run after UserSeeder + ContentSeeder.
 */
class DashboardDemoSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = Profile::all();
        if ($profiles->isEmpty()) {
            $this->command->warn('No profiles found. Run UserSeeder first.');

            return;
        }

        $version = ExamVersion::query()->first();
        if (! $version) {
            $this->command->warn('No exam version found. Run ContentSeeder first.');

            return;
        }

        foreach ($profiles as $profile) {
            $this->seedStreak($profile);
            $this->seedActivity($profile);
            $this->seedExamSessions($profile, $version);
        }

        $this->command->info('Dashboard demo data seeded.');
    }

    private function seedStreak(Profile $profile): void
    {
        ProfileStreakState::query()->updateOrInsert(
            ['profile_id' => $profile->id],
            [
                'current_streak' => 7,
                'longest_streak' => 14,
                'last_active_date_local' => now()->toDateString(),
                'updated_at' => now(),
            ],
        );
    }

    private function seedActivity(Profile $profile): void
    {
        DB::table('profile_daily_activity')
            ->where('profile_id', $profile->id)
            ->delete();

        $today = Carbon::today();
        for ($i = 0; $i < 60; $i++) {
            $date = $today->copy()->subDays($i);
            $hasActivity = rand(0, 10) > 3;
            if (! $hasActivity) {
                continue;
            }

            ProfileDailyActivity::create([
                'profile_id' => $profile->id,
                'date_local' => $date->toDateString(),
                'drill_session_count' => rand(1, 5),
                'drill_duration_seconds' => rand(300, 2400),
            ]);
        }
    }

    private function seedExamSessions(Profile $profile, ExamVersion $version): void
    {
        $existing = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('status', 'submitted')
            ->count();

        if ($existing >= 5) {
            return;
        }

        $writingTaskId = DB::table('exam_version_writing_tasks')
            ->where('exam_version_id', $version->id)
            ->value('id');

        $listeningItemIds = DB::table('exam_version_listening_items')
            ->join('exam_version_listening_sections', 'exam_version_listening_sections.id', '=', 'exam_version_listening_items.section_id')
            ->where('exam_version_listening_sections.exam_version_id', $version->id)
            ->pluck('exam_version_listening_items.id');

        $readingItemIds = DB::table('exam_version_reading_items')
            ->join('exam_version_reading_passages', 'exam_version_reading_passages.id', '=', 'exam_version_reading_items.passage_id')
            ->where('exam_version_reading_passages.exam_version_id', $version->id)
            ->pluck('exam_version_reading_items.id');

        for ($i = 0; $i < 6; $i++) {
            $submittedAt = now()->subDays($i * 5)->subHours(rand(1, 12));

            $session = ExamSession::create([
                'profile_id' => $profile->id,
                'exam_version_id' => $version->id,
                'mode' => 'full',
                'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true,
                'time_extension_factor' => 1.0,
                'started_at' => $submittedAt->copy()->subMinutes(120),
                'server_deadline_at' => $submittedAt->copy()->addMinutes(10),
                'submitted_at' => $submittedAt,
                'status' => 'submitted',
                'coins_charged' => 0,
            ]);

            // MCQ answers for listening
            foreach ($listeningItemIds as $itemId) {
                DB::table('exam_mcq_answers')->insert([
                    'session_id' => $session->id,
                    'item_ref_type' => 'listening',
                    'item_ref_id' => $itemId,
                    'selected_index' => rand(0, 3),
                    'is_correct' => rand(0, 10) > 3,
                    'answered_at' => $submittedAt,
                ]);
            }

            // MCQ answers for reading
            foreach ($readingItemIds as $itemId) {
                DB::table('exam_mcq_answers')->insert([
                    'session_id' => $session->id,
                    'item_ref_type' => 'reading',
                    'item_ref_id' => $itemId,
                    'selected_index' => rand(0, 3),
                    'is_correct' => rand(0, 10) > 4,
                    'answered_at' => $submittedAt,
                ]);
            }

            // Writing submission + grading
            if ($writingTaskId) {
                $subId = \Illuminate\Support\Str::uuid7();
                DB::table('exam_writing_submissions')->insert([
                    'id' => $subId,
                    'session_id' => $session->id,
                    'profile_id' => $profile->id,
                    'task_id' => $writingTaskId,
                    'text' => 'Demo writing submission for seed data.',
                    'word_count' => rand(80, 200),
                    'submitted_at' => $submittedAt,
                ]);

                $job = \App\Models\GradingJob::create([
                    'submission_type' => 'exam_writing',
                    'submission_id' => $subId,
                    'status' => 'ready',
                    'started_at' => $submittedAt,
                    'completed_at' => $submittedAt->copy()->addSeconds(rand(5, 30)),
                ]);

                WritingGradingResult::create([
                    'job_id' => $job->id,
                    'submission_type' => 'exam_writing',
                    'submission_id' => $subId,
                    'version' => 1,
                    'is_active' => true,
                    'rubric_scores' => [
                        'task_achievement' => round(rand(15, 35) / 10, 1),
                        'coherence' => round(rand(15, 35) / 10, 1),
                        'lexical' => round(rand(15, 35) / 10, 1),
                        'grammar' => round(rand(15, 35) / 10, 1),
                    ],
                    'overall_band' => round(rand(40, 80) / 10, 1),
                    'strengths' => ['Good structure'],
                    'improvements' => [['message' => 'Expand vocabulary', 'explanation' => 'Use more varied words']],
                    'rewrites' => [],
                    'annotations' => [],
                    'paragraph_feedback' => [],
                ]);
            }
        }
    }
}
