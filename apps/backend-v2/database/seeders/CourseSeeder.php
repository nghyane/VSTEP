<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CoinTransactionType;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::query()->where('role', 'teacher')->first();
        if (! $teacher) {
            $this->command->warn('No teacher user found — skipping CourseSeeder.');

            return;
        }

        // Khóa đang học (in-progress) — mốc thời gian quanh now() để demo UI "Đang học".
        // 8 buổi: 5 đã qua, 1 hôm nay, 2 sắp tới. Course range = today−16d → today+7d.
        // Dùng VN timezone để "today" khớp với FE (BE chạy UTC, lệch 7h sẽ sai 1 ngày sau 17:00 UTC).
        $today = now('Asia/Ho_Chi_Minh')->startOfDay();
        $inProgressSchedule = [
            ['offset' => -16, 'topic' => 'Listening Part 1–2 + Chiến lược nghe'],
            ['offset' => -14, 'topic' => 'Listening Part 3 + Note-taking'],
            ['offset' => -9, 'topic' => 'Reading Part 1–2 + Skimming/Scanning'],
            ['offset' => -7, 'topic' => 'Reading Part 3–4 + Inference'],
            ['offset' => -2, 'topic' => 'Writing Task 1: Email/Letter'],
            ['offset' => 0, 'topic' => 'Writing Task 2: Essay 250 từ (Live hôm nay)'],
            ['offset' => 5, 'topic' => 'Speaking Part 1–2 + Pronunciation'],
            ['offset' => 7, 'topic' => 'Speaking Part 3 + Mock test tổng'],
        ];
        $inProgressSchedule = array_map(
            fn (array $s) => [
                'date' => $today->copy()->addDays($s['offset'])->toDateString(),
                'start' => '19:30',
                'end' => '21:30',
                'topic' => $s['topic'],
            ],
            $inProgressSchedule,
        );

        $courses = [
            [
                'slug' => 'b1-cap-toc-k101',
                'title' => 'VSTEP B1 Cấp tốc — K101',
                'target_level' => 'B1',
                'target_exam_school' => 'Đợt thi ĐH Bách Khoa Hà Nội (đang diễn ra)',
                'description' => "Khóa đang triển khai — học viên đã trải qua phần Listening/Reading, hôm nay vào phần Writing.\n\nDùng để demo trạng thái 'Đang học' với buổi tiếp theo + tiến độ cam kết.",
                'price_coins' => 0,
                'bonus_coins' => 4000,
                'price_vnd' => 1300000,
                'original_price_vnd' => 2900000,
                'max_slots' => 20,
                'start_date' => $today->copy()->addDays(-16)->toDateString(),
                'end_date' => $today->copy()->addDays(7)->toDateString(),
                'required_full_tests' => 3,
                'commitment_window_days' => 14,
                'exam_cooldown_days' => 3,
                'livestream_url' => 'https://zoom.us/j/example-k101',
                'schedule' => $inProgressSchedule,
            ],
            [
                'slug' => 'b1-cap-toc-k94',
                'title' => 'VSTEP B1 Cấp tốc — K94',
                'target_level' => 'B1',
                'target_exam_school' => 'Đợt thi Đại học Văn Lang 15–17/07/2026',
                'description' => "Khóa luyện thi VSTEP B1 cấp tốc 8 buổi, tập trung 4 kỹ năng Nghe – Đọc – Viết – Nói.\n\nGiáo viên có kinh nghiệm chấm thi VSTEP tại các trường đại học lớn. Cam kết đầu ra B1 hoặc học lại miễn phí.",
                'price_coins' => 0,
                'bonus_coins' => 4000,
                'price_vnd' => 1300000,
                'original_price_vnd' => 2900000,
                'max_slots' => 20,
                'start_date' => '2026-06-23',
                'end_date' => '2026-07-14',
                'required_full_tests' => 3,
                'commitment_window_days' => 14,
                'exam_cooldown_days' => 3,
                'livestream_url' => 'https://zoom.us/j/example-k94',
                'schedule' => [
                    ['date' => '2026-06-23', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Listening Part 1–2 + Chiến lược nghe'],
                    ['date' => '2026-06-25', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Listening Part 3 + Dictation drill'],
                    ['date' => '2026-06-28', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Reading Part 1–2 + Skimming/Scanning'],
                    ['date' => '2026-06-30', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Reading Part 3–4 + Inference'],
                    ['date' => '2026-07-02', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Writing Task 1: Email/Letter'],
                    ['date' => '2026-07-05', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Writing Task 2: Essay 250 từ'],
                    ['date' => '2026-07-09', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Speaking Part 1–2 + Pronunciation'],
                    ['date' => '2026-07-12', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Speaking Part 3 + Mock test tổng'],
                ],
            ],
            [
                'slug' => 'b1-cap-toc-k83',
                'title' => 'VSTEP B1 Cấp tốc — K83',
                'target_level' => 'B1',
                'target_exam_school' => 'Đợt thi HNUE 25/07/2026',
                'description' => "Khóa ôn thi VSTEP B1 sát đề thi HNUE. 8 buổi online qua Zoom.\n\nPhù hợp cho sinh viên cần chứng chỉ B1 để tốt nghiệp hoặc xét tuyển sau đại học.",
                'price_coins' => 0,
                'bonus_coins' => 4000,
                'price_vnd' => 1300000,
                'original_price_vnd' => 2900000,
                'max_slots' => 20,
                'start_date' => '2026-07-07',
                'end_date' => '2026-07-24',
                'required_full_tests' => 3,
                'commitment_window_days' => 14,
                'exam_cooldown_days' => 3,
                'livestream_url' => 'https://zoom.us/j/example-k83',
                'schedule' => [
                    ['date' => '2026-07-07', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Listening Part 1–2 + Note-taking'],
                    ['date' => '2026-07-09', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Listening Part 3 + Practice test'],
                    ['date' => '2026-07-12', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Reading Part 1–2 + Vocabulary'],
                    ['date' => '2026-07-14', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Reading Part 3–4 + Timed practice'],
                    ['date' => '2026-07-16', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Writing Task 1: Formal letter'],
                    ['date' => '2026-07-19', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Writing Task 2: Opinion essay'],
                    ['date' => '2026-07-21', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Speaking Part 1–2 + Fluency drill'],
                    ['date' => '2026-07-23', 'start' => '19:00', 'end' => '21:00', 'topic' => 'Speaking Part 3 + Mock interview'],
                ],
            ],
            [
                'slug' => 'b2-cap-toc-k41',
                'title' => 'VSTEP B2 Cấp tốc — K41',
                'target_level' => 'B2',
                'target_exam_school' => 'Đợt thi ĐH Sư phạm TP.HCM 08/08/2026',
                'description' => "Khóa luyện thi VSTEP B2 chuyên sâu 10 buổi. Dành cho người đã có nền B1 muốn nâng lên B2.\n\nTập trung vào Writing Task 2 (essay 250+ từ) và Speaking Part 3 (thảo luận) — hai phần quyết định band B2.",
                'price_coins' => 0,
                'bonus_coins' => 5000,
                'price_vnd' => 1800000,
                'original_price_vnd' => 3800000,
                'max_slots' => 15,
                'start_date' => '2026-07-13',
                'end_date' => '2026-08-07',
                'required_full_tests' => 4,
                'commitment_window_days' => 18,
                'exam_cooldown_days' => 3,
                'livestream_url' => 'https://zoom.us/j/example-k41',
                'schedule' => [
                    ['date' => '2026-07-13', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Listening: Academic lectures + Note completion'],
                    ['date' => '2026-07-16', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Listening: Conversations + Multiple choice'],
                    ['date' => '2026-07-19', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Reading: Long passages + True/False/NG'],
                    ['date' => '2026-07-22', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Reading: Matching headings + Summary'],
                    ['date' => '2026-07-25', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Writing Task 1: Report/Chart description'],
                    ['date' => '2026-07-28', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Writing Task 2: Argumentative essay'],
                    ['date' => '2026-07-31', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Writing: Chữa bài + Rubric scoring'],
                    ['date' => '2026-08-02', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Speaking Part 1–2: Cue card + Follow-up'],
                    ['date' => '2026-08-04', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Speaking Part 3: Discussion + Debate'],
                    ['date' => '2026-08-06', 'start' => '19:30', 'end' => '21:30', 'topic' => 'Mock test tổng 4 kỹ năng'],
                ],
            ],
        ];

        // Khóa K101 dùng dates động theo now() → re-seed phải sync lại schedule.
        $dynamicScheduleSlugs = ['b1-cap-toc-k101'];

        foreach ($courses as $c) {
            $schedule = $c['schedule'];
            unset($c['schedule']);

            $course = Course::updateOrCreate(
                ['slug' => $c['slug']],
                [
                    ...$c,
                    'teacher_id' => $teacher->id,
                    'is_published' => true,
                ],
            );

            if (in_array($c['slug'], $dynamicScheduleSlugs, true)) {
                DB::table('course_schedule_items')->where('course_id', $course->id)->delete();
            }

            if ($course->scheduleItems()->count() === 0) {
                foreach ($schedule as $i => $s) {
                    DB::table('course_schedule_items')->insert([
                        'id' => Str::orderedUuid()->toString(),
                        'course_id' => $course->id,
                        'session_number' => $i + 1,
                        'date' => $s['date'],
                        'start_time' => $s['start'],
                        'end_time' => $s['end'],
                        'topic' => $s['topic'],
                    ]);
                }
            }
        }

        // Enroll learner into the second course (K83) + the in-progress demo course (K101).
        $learner = User::query()->where('email', 'learner@vstep.test')->first();
        $profile = $learner?->initialProfile();

        $enrollMap = [
            'b1-cap-toc-k83' => ['enrolled_at' => now()],
            'b1-cap-toc-k101' => ['enrolled_at' => now('Asia/Ho_Chi_Minh')->subDays(16)->setTime(19, 30)],
        ];

        if ($profile) {
            $wallet = app(WalletService::class);
            foreach ($enrollMap as $slug => $opts) {
                $course = Course::query()->where('slug', $slug)->first();
                if (! $course) {
                    continue;
                }
                $exists = CourseEnrollment::query()
                    ->where('profile_id', $profile->id)
                    ->where('course_id', $course->id)
                    ->exists();
                if ($exists) {
                    continue;
                }

                CourseEnrollment::create([
                    'profile_id' => $profile->id,
                    'course_id' => $course->id,
                    'enrolled_at' => $opts['enrolled_at'],
                    'coins_paid' => 0,
                    'bonus_coins_received' => $course->bonus_coins,
                ]);

                if ($course->bonus_coins > 0) {
                    $wallet->credit($profile, $course->bonus_coins, CoinTransactionType::OnboardingBonus, null, ['reason' => 'course_bonus']);
                }
            }
        }
    }
}
