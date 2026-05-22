<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\BookingStatus;
use App\Enums\CoinSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\OrderStatus;
use App\Enums\SlotStatus;
use App\Models\CoinTransaction;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Services\CourseService;
use App\Services\NotificationService;
use App\Services\WalletService;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AdminCourseService
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly NotificationService $notificationService,
        private readonly WalletService $walletService,
    ) {}

    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): Builder
    {
        $query = Course::query()
            ->with('teacher:id,full_name,email')
            ->withCount(['enrollments', 'scheduleItems']);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $b) use ($term) {
                $b->where('title', 'ilike', $term)->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['target_level'])) {
            $query->where('target_level', $filters['target_level']);
        }

        if (! empty($filters['teacher_id'])) {
            $query->where('teacher_id', $filters['teacher_id']);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data): Course
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }
        if (! array_key_exists('bonus_coins', $data)) {
            $data['bonus_coins'] = 0;
        }
        if (! array_key_exists('price_coins', $data) || $data['price_coins'] === null) {
            // Legacy field — admin không nhập, mặc định 0.
            $data['price_coins'] = 0;
        }
        if (! array_key_exists('max_slots_per_student', $data)) {
            $data['max_slots_per_student'] = 2;
        }
        if (! array_key_exists('booking_coin_cost', $data) || $data['booking_coin_cost'] === null) {
            $data['booking_coin_cost'] = 50;
        }

        return Course::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function update(Course $course, array $data): Course
    {
        $course->fill($data)->save();

        return $course->fresh(['teacher']);
    }

    public function delete(Course $course): void
    {
        // FK enrollments + enrollment_orders đều RESTRICT — chặn xóa khi còn ghi danh hoặc
        // đơn mua đang treo, tránh DB throw 500 leak ra response.
        if ($course->enrollments()->exists()) {
            throw ValidationException::withMessages([
                'course' => ['Không thể xóa khóa học đã có học viên ghi danh.'],
            ]);
        }
        if (CourseEnrollmentOrder::query()->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages([
                'course' => ['Không thể xóa khóa học còn đơn mua tồn tại.'],
            ]);
        }

        $course->delete();
    }

    public function setPublished(Course $course, bool $value): Course
    {
        $course->forceFill(['is_published' => $value])->save();

        return $course->fresh(['teacher']);
    }

    // ─── Schedule items (buổi học chung của khóa) ──────────

    /**
     * @param  array<string,mixed>  $data
     */
    public function createScheduleItem(Course $course, array $data): CourseScheduleItem
    {
        // Auto-assign session_number = max + 1 nếu admin không truyền.
        if (! array_key_exists('session_number', $data) || $data['session_number'] === null) {
            $data['session_number'] = (int) $course->scheduleItems()->max('session_number') + 1;
        }
        $data['course_id'] = $course->id;

        return CourseScheduleItem::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateScheduleItem(CourseScheduleItem $item, array $data): CourseScheduleItem
    {
        $item->fill($data)->save();

        return $item->refresh();
    }

    public function deleteScheduleItem(CourseScheduleItem $item): void
    {
        $item->delete();
    }

    // ─── Enrollments (read-only) ───────────────────────────

    /**
     * Builder để admin xem danh sách học viên đã ghi danh khóa.
     * Eager-load profile + account để hiển thị tên/email.
     */
    public function listEnrollments(Course $course): Builder
    {
        return CourseEnrollment::query()
            ->where('course_id', $course->id)
            ->with(['profile:id,account_id,nickname,target_level,target_deadline', 'profile.account:id,full_name,email'])
            ->orderByDesc('enrolled_at');
    }

    /**
     * Hủy ghi danh — hard delete row. Coin_transactions giữ nguyên (append-only ledger
     * theo design-decisions §2); không refund tự động, admin tự xử lý qua kênh riêng.
     * Push notification cho học viên để họ biết bị unenroll.
     */
    public function deleteEnrollment(CourseEnrollment $enrollment): void
    {
        // Lấy thông tin trước khi xóa để dùng trong notification.
        $enrollment->loadMissing(['profile', 'course']);
        $profile = $enrollment->profile;
        $course = $enrollment->course;
        $courseTitle = $course?->title ?? 'khóa học';
        $courseId = $course?->id;

        DB::transaction(function () use ($enrollment, $profile, $courseId) {
            $enrollment->delete();
            // Cleanup paid/pending orders để học viên có thể ghi danh lại khóa sau khi
            // admin hủy. Partial unique index uq_course_order_active chỉ áp khi status
            // IN ('pending', 'paid'); chuyển sang 'cancelled' → index không chặn order
            // mới + CourseOrderService.createOrder không còn thấy "duplicate".
            if ($profile !== null && $courseId !== null) {
                CourseEnrollmentOrder::query()
                    ->where('profile_id', $profile->id)
                    ->where('course_id', $courseId)
                    ->whereIn('status', OrderStatus::activeValues())
                    ->update(['status' => OrderStatus::Cancelled]);
            }
        });

        if ($profile !== null) {
            // Sau commit để chắc chắn DB đã xóa trước khi gửi noti.
            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'course_unenrolled',
                title: 'Bạn đã bị hủy ghi danh',
                body: "Admin đã hủy ghi danh của bạn khỏi khóa \"{$courseTitle}\". "
                    .'Nếu cần làm rõ, vui lòng liên hệ trung tâm.',
                iconKey: 'alert',
                payload: $courseId !== null ? ['course_id' => $courseId] : null,
            ));
        }
    }

    /**
     * Admin thêm thủ công học viên vào khóa (ngoài luồng mua bằng xu).
     * Delegates to CourseService::createEnrollment — single source of truth.
     * No bonus coins credited for admin manual enroll.
     */
    public function enrollProfile(Course $course, Profile $profile): CourseEnrollment
    {
        return DB::transaction(function () use ($course, $profile) {
            $enrollment = $this->courseService->createEnrollment(
                profile: $profile,
                course: $course,
                creditBonus: false,
                notiTitle: 'Bạn đã được thêm vào khóa',
                notiBody: "Admin đã thêm bạn vào khóa \"{$course->title}\". Vào mục Khóa học để xem lịch buổi học.",
            );

            return $enrollment->fresh(['profile.account']);
        });
    }

    public function setEnrollmentCommitment(CourseEnrollment $enrollment, bool $value): CourseEnrollment
    {
        $enrollment->forceFill(['acknowledged_commitment' => $value])->save();

        return $enrollment->fresh(['profile.account']);
    }

    // ─── Teacher slots (lịch rảnh giáo viên cho buổi 1-1) ──

    /**
     * Slot list trong khung [start, end] kèm booking active để admin biết slot nào đang
     * có học viên đặt. Range mặc định -7d..+35d giống FE user.
     *
     * @return Collection<int,TeacherSlot>
     */
    public function listSlots(Course $course, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Collection
    {
        $start ??= CarbonImmutable::now()->subDays(7)->startOfDay();
        $end ??= CarbonImmutable::now()->addDays(35)->endOfDay();

        return TeacherSlot::query()
            ->where('course_id', $course->id)
            ->whereBetween('starts_at', [$start, $end])
            ->with(['bookings.profile.account:id,full_name,email'])
            ->orderBy('starts_at')
            ->get();
    }

    /**
     * Tạo 1 slot riêng lẻ. Slot mới luôn ở status='open'. Teacher_id lấy từ course.
     */
    public function createSlot(Course $course, array $data): TeacherSlot
    {
        $startsAt = CarbonImmutable::parse($data['starts_at']);
        $this->guardSlotWithinCourseWindow($course, $startsAt);
        $this->guardSlotConflict($course, $startsAt);

        try {
            return TeacherSlot::create([
                'course_id' => $course->id,
                'teacher_id' => $course->teacher_id,
                'starts_at' => $startsAt,
                'duration_minutes' => (int) ($data['duration_minutes'] ?? 30),
                'status' => SlotStatus::Open,
            ]);
        } catch (UniqueConstraintViolationException) {
            // Race với bulk-create: pre-check pass nhưng DB unique chặn.
            throw ValidationException::withMessages([
                'starts_at' => ['Đã có slot khác bắt đầu cùng giờ này trong khóa.'],
            ]);
        }
    }

    /**
     * Bulk-generate slots theo pattern: trong khoảng [start_date, end_date], tại các
     * thứ {weekdays}, tại các giờ {times}, mỗi slot duration_minutes.
     *
     * Idempotent: bỏ qua slot trùng starts_at (course đã có sẵn). Skip cả slot trong
     * quá khứ để tránh tạo lịch lỗi thời.
     *
     * @return array{created: int, skipped: int}
     */
    public function bulkCreateSlots(Course $course, array $data): array
    {
        // App timezone là UTC nhưng admin nhập giờ theo local VN. Parse ngày+giờ trong
        // Asia/Ho_Chi_Minh để "19:30" thật sự là 19:30 giờ VN, không phải 19:30 UTC
        // (= 02:30 sáng hôm sau VN, đúng bug đã gặp).
        $tz = 'Asia/Ho_Chi_Minh';
        // Clamp input range vào trong course window — admin có thể gõ start_date sớm
        // hơn khóa hoặc end_date sau khi khóa kết thúc, ta clamp thay vì reject để
        // bulk vẫn tạo được phần intersect.
        $courseStart = CarbonImmutable::parse($course->start_date->toDateString(), $tz)->startOfDay();
        $courseEnd = CarbonImmutable::parse($course->end_date->toDateString(), $tz)->endOfDay();
        $start = CarbonImmutable::parse($data['start_date'], $tz)->startOfDay()->max($courseStart);
        $end = CarbonImmutable::parse($data['end_date'], $tz)->endOfDay()->min($courseEnd);
        if ($start->greaterThan($end)) {
            throw ValidationException::withMessages([
                'start_date' => ['Khoảng ngày đã chọn không nằm trong thời gian khóa học.'],
            ]);
        }
        $weekdays = $data['weekdays'];
        $times = $data['times'];
        $duration = (int) ($data['duration_minutes'] ?? 30);

        $candidates = [];
        $now = CarbonImmutable::now();
        foreach (CarbonPeriod::create($start, '1 day', $end) as $day) {
            $dayImm = CarbonImmutable::instance($day)->setTimezone($tz);
            if (! in_array($dayImm->dayOfWeek, $weekdays, true)) {
                continue;
            }
            foreach ($times as $time) {
                [$h, $m] = array_map('intval', explode(':', $time));
                $slotStart = $dayImm->setTime($h, $m);
                if ($slotStart->lessThanOrEqualTo($now)) {
                    continue;
                }
                // Key dedupe theo UTC để khớp với storage column (TIMESTAMP without TZ
                // = UTC); 2 input giờ local khác nhau nhưng cùng UTC sẽ collapse.
                $key = $slotStart->utc()->toDateTimeString();
                $candidates[$key] = $slotStart;
            }
        }

        if ($candidates === []) {
            return ['created' => 0, 'skipped' => 0];
        }

        // Lock course để 2 admin bulk-create cùng course không race khi SELECT existing
        // → INSERT. DB unique index (course_id, starts_at) là chốt chặn cuối, nhưng lock
        // giúp tránh QueryException ở common case.
        return DB::transaction(function () use ($course, $candidates, $duration) {
            Course::query()->whereKey($course->id)->lockForUpdate()->first();

            $existing = TeacherSlot::query()
                ->where('course_id', $course->id)
                ->whereIn('starts_at', array_keys($candidates))
                ->pluck('starts_at')
                ->map(fn ($v) => CarbonImmutable::parse($v)->toDateTimeString())
                ->all();
            $existingSet = array_flip($existing);

            $rows = [];
            $timestamp = now();
            foreach ($candidates as $key => $startsAt) {
                if (isset($existingSet[$key])) {
                    continue;
                }
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'course_id' => $course->id,
                    'teacher_id' => $course->teacher_id,
                    'starts_at' => $startsAt,
                    'duration_minutes' => $duration,
                    'status' => SlotStatus::Open,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }

            if ($rows !== []) {
                TeacherSlot::query()->insert($rows);
            }

            return [
                'created' => count($rows),
                'skipped' => count($candidates) - count($rows),
            ];
        });
    }

    public function updateSlot(TeacherSlot $slot, array $data): TeacherSlot
    {
        $this->guardSlotHasActiveBooking($slot, 'Slot đang có học viên đặt — hãy hủy booking trước khi sửa.');

        if (array_key_exists('starts_at', $data)) {
            $newStart = CarbonImmutable::parse($data['starts_at']);
            // Cho phép giữ nguyên slot.starts_at hiện tại (no-op edit) — chỉ check conflict
            // khi đổi sang giờ khác.
            if (! $slot->starts_at->equalTo($newStart)) {
                $this->guardSlotWithinCourseWindow($slot->course, $newStart);
                $this->guardSlotConflict($slot->course, $newStart, exceptId: $slot->id);
                $slot->starts_at = $newStart;
            }
        }
        if (array_key_exists('duration_minutes', $data)) {
            $slot->duration_minutes = (int) $data['duration_minutes'];
        }

        $slot->save();

        return $slot->refresh();
    }

    public function deleteSlot(TeacherSlot $slot): void
    {
        $this->guardSlotHasActiveBooking($slot, 'Slot đang có học viên đặt — hãy hủy booking trước khi xóa.');
        $slot->delete();
    }

    private function guardSlotWithinCourseWindow(Course $course, CarbonImmutable $startsAt): void
    {
        // Course.start_date/end_date là DATE (không TZ). Admin nghĩ theo giờ VN nên
        // diễn giải date trong Asia/Ho_Chi_Minh: slot phải nằm trong [start 00:00 VN,
        // end 23:59:59 VN]. Carbon so sánh đúng kể cả khác TZ.
        $tz = 'Asia/Ho_Chi_Minh';
        $windowStart = CarbonImmutable::parse($course->start_date->toDateString(), $tz)->startOfDay();
        $windowEnd = CarbonImmutable::parse($course->end_date->toDateString(), $tz)->endOfDay();
        if ($startsAt->lt($windowStart) || $startsAt->gt($windowEnd)) {
            $startDisplay = $windowStart->format('d/m/Y');
            $endDisplay = $windowEnd->format('d/m/Y');
            throw ValidationException::withMessages([
                'starts_at' => ["Slot phải nằm trong thời gian khóa học ({$startDisplay} – {$endDisplay})."],
            ]);
        }
    }

    private function guardSlotConflict(Course $course, CarbonImmutable $startsAt, ?string $exceptId = null): void
    {
        $query = TeacherSlot::query()
            ->where('course_id', $course->id)
            ->where('starts_at', $startsAt);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages([
                'starts_at' => ['Đã có slot khác bắt đầu cùng giờ này trong khóa.'],
            ]);
        }
    }

    private function guardSlotHasActiveBooking(TeacherSlot $slot, string $message): void
    {
        $hasActive = $slot->bookings()->whereIn('status', BookingStatus::activeValues())->exists();
        if ($hasActive) {
            throw ValidationException::withMessages(['slot' => [$message]]);
        }
    }

    // ─── Teacher bookings (admin quản lý booking 1-1) ──────

    /**
     * Builder bookings của 1 course để paginate. Eager-load slot + profile + account.
     */
    public function listBookings(Course $course): Builder
    {
        return TeacherBooking::query()
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->with(['slot:id,course_id,starts_at,duration_minutes', 'profile:id,account_id,nickname', 'profile.account:id,full_name,email'])
            ->orderByDesc('booked_at');
    }

    /**
     * Sửa meet_url (admin paste link Zoom/Meet thật, thay mock link đã sinh khi book).
     */
    public function updateBookingMeetUrl(TeacherBooking $booking, ?string $meetUrl): TeacherBooking
    {
        if (! in_array($booking->status, BookingStatus::activeStatuses(), true)) {
            throw ValidationException::withMessages([
                'booking' => ['Chỉ booking đang active mới chỉnh được meet URL.'],
            ]);
        }

        $booking->forceFill(['meet_url' => $meetUrl])->save();

        return $booking->fresh(['slot', 'profile.account']);
    }

    /**
     * Admin cancel booking — khác với student tự cancel (không refund). Admin cancel
     * thường do trung tâm sai (teacher nghỉ, đổi lịch) nên refund xu + push noti.
     *
     * Refund amount = abs(delta) của coin tx gốc (source_type=TeacherBooking, source_id=booking).
     * Tự dùng ledger gốc thay vì course.booking_coin_cost hiện tại để tránh học viên bị refund
     * thiếu/thừa khi admin chỉnh giá khóa giữa chừng.
     */
    public function cancelBooking(TeacherBooking $booking): TeacherBooking
    {
        if ($booking->status === BookingStatus::Cancelled) {
            throw ValidationException::withMessages([
                'booking' => ['Booking đã hủy rồi.'],
            ]);
        }

        $booking->loadMissing(['slot.course', 'profile.account']);
        $slot = $booking->slot;
        $profile = $booking->profile;
        $course = $slot?->course;

        // Tìm coin tx gốc để biết refund bao nhiêu xu.
        $originalTx = CoinTransaction::query()
            ->where('source_type', CoinSourceType::TeacherBooking->value)
            ->where('source_id', $booking->id)
            ->where('type', CoinTransactionType::TeacherBooking->value)
            ->orderBy('id')
            ->first();
        $refundAmount = $originalTx !== null ? abs((int) $originalTx->delta) : 0;

        DB::transaction(function () use ($booking, $slot, $profile, $refundAmount) {
            $booking->forceFill(['status' => BookingStatus::Cancelled])->save();

            // Free slot lại để học viên khác (hoặc chính học viên đó) có thể book.
            if ($slot !== null && $slot->status === SlotStatus::Booked) {
                $slot->forceFill(['status' => SlotStatus::Open])->save();
            }

            if ($profile !== null && $refundAmount > 0) {
                $this->walletService->credit(
                    $profile,
                    $refundAmount,
                    CoinTransactionType::AdminGrant,
                    $booking,
                    ['reason' => 'admin_cancel_booking', 'booking_id' => $booking->id],
                );
            }
        });

        if ($profile !== null) {
            $courseTitle = $course?->title ?? 'khóa học';
            $startsAt = $slot?->starts_at?->locale('vi')->isoFormat('HH:mm DD/MM') ?? 'buổi học';
            $bodyRefund = $refundAmount > 0
                ? " Đã hoàn {$refundAmount} xu vào ví của bạn."
                : '';
            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'booking_cancelled',
                title: 'Buổi học 1-1 đã bị hủy',
                body: "Admin đã hủy buổi {$startsAt} của khóa \"{$courseTitle}\".{$bodyRefund} Nếu cần làm rõ, vui lòng liên hệ trung tâm.",
                iconKey: 'alert',
                payload: [
                    'booking_id' => $booking->id,
                    'refunded' => $refundAmount,
                ],
            ));
        }

        return $booking->fresh(['slot', 'profile.account']);
    }
}
