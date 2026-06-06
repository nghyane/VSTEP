<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CoinTransactionType;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\CourseScheduleItem;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Database\Seeder;

final class DemoCourseSeeder extends Seeder
{
    private const ACTIVE_DEMO_COURSE_SLUGS = ['b1-cap-toc-k101', 'b2-intensive-k201'];

    private const LEGACY_DEMO_COURSE_SLUGS = ['b1-cap-toc-k94', 'b1-cap-toc-k83', 'b2-cap-toc-k41'];

    public function run(WalletService $wallet): void
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

        // Khóa sắp khai giảng — bắt đầu sau K101 để cùng 1 giáo viên không bị trùng thời khóa biểu.
        $upcomingSchedule = [
            ['offset' => 14, 'topic' => 'B2 Listening: Academic lectures + Signposting'],
            ['offset' => 16, 'topic' => 'B2 Listening: Conversations + Detail questions'],
            ['offset' => 18, 'topic' => 'B2 Reading: Long passages + Matching headings'],
            ['offset' => 21, 'topic' => 'B2 Reading: Inference + Vocabulary in context'],
            ['offset' => 23, 'topic' => 'Writing Task 1: Report/Chart description'],
            ['offset' => 25, 'topic' => 'Writing Task 2: Argumentative essay'],
            ['offset' => 28, 'topic' => 'Speaking Part 1–2: Fluency + Cue card'],
            ['offset' => 30, 'topic' => 'Speaking Part 3: Discussion + Mock interview'],
        ];
        $upcomingSchedule = array_map(
            fn (array $s) => [
                'date' => $today->copy()->addDays($s['offset'])->toDateString(),
                'start' => '19:00',
                'end' => '21:00',
                'topic' => $s['topic'],
            ],
            $upcomingSchedule,
        );

        $legacyCourseIds = Course::query()
            ->whereIn('slug', self::LEGACY_DEMO_COURSE_SLUGS)
            ->pluck('id');
        if ($legacyCourseIds->isNotEmpty()) {
            CourseEnrollmentOrder::query()->whereIn('course_id', $legacyCourseIds)->delete();
            CourseEnrollment::query()->whereIn('course_id', $legacyCourseIds)->delete();
            Course::query()->whereIn('id', $legacyCourseIds)->delete();
        }

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
                'commitment_window_days' => 5,
                'livestream_url' => 'https://zoom.us/j/example-k101',
                'schedule' => $inProgressSchedule,
            ],
            [
                'slug' => 'b2-intensive-k201',
                'title' => 'VSTEP B2 Intensive — K201',
                'target_level' => 'B2',
                'target_exam_school' => 'Đợt thi VSTEP cuối tháng tới',
                'description' => "Khóa B2 chuyên sâu 8 buổi cho học viên đã có nền B1+.\n\nLịch được đặt sau K101 để Demo Teacher phụ trách 2 khóa nhưng thời khóa biểu không bị trùng.",
                'price_coins' => 0,
                'bonus_coins' => 5000,
                'price_vnd' => 1800000,
                'original_price_vnd' => 3800000,
                'max_slots' => 15,
                'start_date' => $today->copy()->addDays(14)->toDateString(),
                'end_date' => $today->copy()->addDays(32)->toDateString(),
                'required_full_tests' => 4,
                'commitment_window_days' => 5,
                'livestream_url' => 'https://zoom.us/j/example-k201',
                'schedule' => $upcomingSchedule,
            ],
        ];

        // Demo courses dùng dates động theo now() → re-seed phải sync lại schedule.
        $dynamicScheduleSlugs = self::ACTIVE_DEMO_COURSE_SLUGS;

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
                CourseScheduleItem::query()->where('course_id', $course->id)->delete();
            }

            if ($course->scheduleItems()->count() === 0) {
                foreach ($schedule as $i => $s) {
                    CourseScheduleItem::create([
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

        // Enroll main learner into both demo courses.
        $learner = User::query()->where('email', 'learner@vstep.test')->first();
        $profile = $learner?->initialProfile();

        $enrollMap = [
            'b1-cap-toc-k101' => ['enrolled_at' => now('Asia/Ho_Chi_Minh')->subDays(16)->setTime(19, 30)],
            'b2-intensive-k201' => ['enrolled_at' => now('Asia/Ho_Chi_Minh')],
        ];

        if ($profile) {
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
