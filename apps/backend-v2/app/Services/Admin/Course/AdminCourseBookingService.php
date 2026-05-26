<?php

declare(strict_types=1);

namespace App\Services\Admin\Course;

use App\Enums\BookingStatus;
use App\Enums\CoinSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Enums\SlotStatus;
use App\Models\CoinTransaction;
use App\Models\Course;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Services\Admin\Course\Contracts\AdminCourseBookingInterface;
use App\Services\NotificationService;
use App\Services\WalletService;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AdminCourseBookingService implements AdminCourseBookingInterface
{
    public function __construct(
        private readonly WalletService $wallet,
        private readonly NotificationService $notification,
    ) {}

    public function listSlots(Course $course, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Collection
    {
        $query = TeacherSlot::query()
            ->where('course_id', $course->id)
            ->with(['bookings.profile.account:id,full_name,email'])
            ->orderBy('starts_at');

        // Admin cần thấy toàn bộ slots — chỉ filter date khi client truyền explicit.
        if ($start || $end) {
            $start ??= CarbonImmutable::now()->subDays(7)->startOfDay();
            $end ??= CarbonImmutable::now()->addDays(365)->endOfDay();
            $query->whereBetween('starts_at', [$start, $end]);
        }

        return $query->get();
    }

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
            throw ValidationException::withMessages([
                'starts_at' => ['Đã có slot khác bắt đầu cùng giờ này trong khóa.'],
            ]);
        }
    }

    /** @return array{created: int, skipped: int} */
    public function bulkCreateSlots(Course $course, array $data): array
    {
        $tz = 'Asia/Ho_Chi_Minh';
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
                $key = $slotStart->utc()->toDateTimeString();
                $candidates[$key] = $slotStart;
            }
        }

        if ($candidates === []) {
            return ['created' => 0, 'skipped' => 0];
        }

        return DB::transaction(function () use ($course, $candidates, $duration) {
            Course::query()->whereKey($course->id)->lockForUpdate()->first();

            $existing = TeacherSlot::query()
                ->where('course_id', $course->id)
                ->whereIn('starts_at', array_keys($candidates))
                ->pluck('starts_at')
                ->map(fn ($v) => CarbonImmutable::parse($v)->toDateTimeString())->all();
            $existingSet = array_flip($existing);

            $rows = [];
            $timestamp = now();
            foreach ($candidates as $key => $startsAt) {
                if (isset($existingSet[$key])) {
                    continue;
                }
                $rows[] = [
                    'id' => (string) Str::uuid(), 'course_id' => $course->id,
                    'teacher_id' => $course->teacher_id, 'starts_at' => $startsAt,
                    'duration_minutes' => $duration, 'status' => SlotStatus::Open,
                    'created_at' => $timestamp, 'updated_at' => $timestamp,
                ];
            }

            if ($rows !== []) {
                TeacherSlot::query()->insert($rows);
            }

            return ['created' => count($rows), 'skipped' => count($candidates) - count($rows)];
        });
    }

    public function updateSlot(TeacherSlot $slot, array $data): TeacherSlot
    {
        $this->guardSlotHasActiveBooking($slot, 'Slot đang có học viên đặt — hãy hủy booking trước khi sửa.');
        if (array_key_exists('starts_at', $data)) {
            $newStart = CarbonImmutable::parse($data['starts_at']);
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

    public function listBookings(Course $course): Builder
    {
        return TeacherBooking::query()
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->with(['slot:id,course_id,starts_at,duration_minutes', 'profile:id,account_id,nickname', 'profile.account:id,full_name,email'])
            ->orderByDesc('booked_at');
    }

    public function updateBookingMeetUrl(TeacherBooking $booking, ?string $meetUrl): TeacherBooking
    {
        if (! in_array($booking->status, BookingStatus::activeStatuses(), true)) {
            throw ValidationException::withMessages(['booking' => ['Chỉ booking đang active mới chỉnh được meet URL.']]);
        }
        $booking->update(['meet_url' => $meetUrl]);

        return $booking->fresh(['slot', 'profile.account']);
    }

    public function cancelBooking(TeacherBooking $booking): TeacherBooking
    {
        if ($booking->status === BookingStatus::Cancelled) {
            throw ValidationException::withMessages(['booking' => ['Booking đã hủy rồi.']]);
        }

        $booking->update(['status' => BookingStatus::Cancelled, 'cancelled_at' => now()]);

        $coinTx = CoinTransaction::query()
            ->where('source_type', CoinSourceType::TeacherBooking)
            ->where('source_id', $booking->id)
            ->where('type', CoinTransactionType::Spend)
            ->first();

        if ($coinTx) {
            $amount = abs($coinTx->delta);
            $this->wallet->credit($booking->profile, $amount, CoinTransactionType::Refund, CoinSourceType::TeacherBooking, $booking->id);
            $this->wallet->recalculateSpendingToday($booking->profile);
        }

        $this->notification->push(
            $booking->profile,
            type: NotificationType::BookingCancelled,
            title: 'Buổi học đã bị hủy',
            body: "Buổi học {$booking->slot->starts_at->format('d/m/Y H:i')} đã bị hủy bởi trung tâm.",
            iconKey: IconKey::Alert,
            dedupKey: "booking_cancelled:{$booking->id}",
        );

        return $booking->fresh(['slot', 'profile.account']);
    }

    private function guardSlotWithinCourseWindow(Course $course, CarbonImmutable $startsAt): void
    {
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
        $query = TeacherSlot::query()->where('course_id', $course->id)->where('starts_at', $startsAt);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages(['starts_at' => ['Đã có slot khác bắt đầu cùng giờ này trong khóa.']]);
        }
    }

    private function guardSlotHasActiveBooking(TeacherSlot $slot, string $message): void
    {
        if ($slot->bookings()->whereIn('status', BookingStatus::activeValues())->exists()) {
            throw ValidationException::withMessages(['slot' => [$message]]);
        }
    }
}
