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
use App\Models\CourseScheduleItem;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Services\Admin\Course\Contracts\AdminCourseBookingInterface;
use App\Services\NotificationEmailService;
use App\Services\NotificationService;
use App\Services\WalletService;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AdminCourseBookingService implements AdminCourseBookingInterface
{
    public function __construct(
        private readonly WalletService $wallet,
        private readonly NotificationService $notification,
        private readonly NotificationEmailService $email,
    ) {}

    public function listSlots(Course $course, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Builder
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

        return $query;
    }

    public function createSlot(Course $course, array $data): TeacherSlot
    {
        $startsAt = CarbonImmutable::parse($data['starts_at']);
        $duration = (int) ($data['duration_minutes'] ?? 30);
        $this->guardSlotWithinCourseWindow($course, $startsAt);
        $this->guardSlotConflict($course, $startsAt, $duration);
        $this->guardSlotDoesNotOverlapSchedule($course, $startsAt, $duration);

        try {
            return TeacherSlot::create([
                'course_id' => $course->id,
                'teacher_id' => $course->teacher_id,
                'starts_at' => $startsAt,
                'duration_minutes' => $duration,
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
                $slotStart = $dayImm->setTime($h, $m)->utc();
                if ($slotStart->lessThanOrEqualTo($now)) {
                    continue;
                }
                $key = $slotStart->toDateTimeString();
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
                ->map(fn ($v) => CarbonImmutable::parse($v)->utc()->toDateTimeString())->all();
            $existingSet = array_flip($existing);

            $rows = [];
            $timestamp = now();
            foreach ($candidates as $key => $startsAt) {
                if (isset($existingSet[$key])) {
                    continue;
                }
                if ($this->slotConflicts($course, $startsAt, $duration)) {
                    continue;
                }
                if ($this->slotOverlapsSchedule($course, $startsAt, $duration)) {
                    continue;
                }
                if ($this->candidateOverlapsRows($startsAt, $duration, $rows)) {
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
                try {
                    TeacherSlot::query()->insert($rows);
                } catch (UniqueConstraintViolationException) {
                    throw ValidationException::withMessages([
                        'slots' => ['Một số slot trùng lịch đã tồn tại. Vui lòng kiểm tra lại khung giờ.'],
                    ]);
                }
            }

            return ['created' => count($rows), 'skipped' => count($candidates) - count($rows)];
        });
    }

    public function updateSlot(TeacherSlot $slot, array $data): TeacherSlot
    {
        $this->guardSlotHasActiveBooking($slot, 'Slot đang có học viên đặt — hãy hủy booking trước khi sửa.');
        $newStart = $slot->starts_at instanceof CarbonImmutable
            ? $slot->starts_at
            : CarbonImmutable::parse($slot->starts_at);
        $newDuration = (int) $slot->duration_minutes;
        if (array_key_exists('starts_at', $data)) {
            $newStart = CarbonImmutable::parse($data['starts_at']);
            if (! $slot->starts_at->equalTo($newStart)) {
                if ($newStart->lessThanOrEqualTo(CarbonImmutable::now())) {
                    throw ValidationException::withMessages(['starts_at' => ['Không thể dời slot về thời điểm đã qua.']]);
                }
            }
        }
        if (array_key_exists('duration_minutes', $data)) {
            $newDuration = (int) $data['duration_minutes'];
        }

        if (! $slot->starts_at->equalTo($newStart) || (int) $slot->duration_minutes !== $newDuration) {
            $this->guardSlotWithinCourseWindow($slot->course, $newStart);
            $this->guardSlotConflict($slot->course, $newStart, $newDuration, exceptId: $slot->id);
            $this->guardSlotDoesNotOverlapSchedule($slot->course, $newStart, $newDuration);
            $slot->starts_at = $newStart;
            $slot->duration_minutes = $newDuration;
        }
        $slot->save();

        return $slot->refresh();
    }

    public function deleteSlot(TeacherSlot $slot): void
    {
        $this->guardSlotHasActiveBooking($slot, 'Slot đang có học viên đặt — hãy hủy booking trước khi xóa.');
        $slot->delete();
    }

    public function listBookings(
        Course $course,
        ?string $status = null,
        ?string $search = null,
        string $sort = 'booked_at',
        string $direction = 'desc',
    ): Builder {
        $query = TeacherBooking::query()
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->with(['slot:id,course_id,starts_at,duration_minutes', 'profile:id,account_id,nickname', 'profile.account:id,full_name,email']);

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->whereHas('profile.account', fn ($a) => $a->where('full_name', 'ilike', "%{$search}%")->orWhere('email', 'ilike', "%{$search}%"))
                    ->orWhereHas('profile', fn ($p) => $p->where('nickname', 'ilike', "%{$search}%"));
            });
        }

        $allowedSorts = ['booked_at', 'status', 'starts_at'];
        $sortCol = in_array($sort, $allowedSorts, true) ? $sort : 'booked_at';
        $dir = $direction === 'asc' ? 'asc' : 'desc';

        if ($sortCol === 'starts_at') {
            $query->orderBy(
                TeacherSlot::query()
                    ->select('starts_at')
                    ->whereColumn('teacher_slots.id', 'teacher_bookings.slot_id')
                    ->limit(1),
                $dir,
            );
        } elseif ($sortCol === 'booked_at') {
            $query->orderBy('booked_at', $dir);
        } else {
            $query->orderBy($sortCol, $dir)->orderByDesc('booked_at');
        }

        return $query;
    }

    public function updateBookingMeetUrl(TeacherBooking $booking, ?string $meetUrl): TeacherBooking
    {
        if (! in_array($booking->status, BookingStatus::activeStatuses(), true)) {
            throw ValidationException::withMessages(['booking' => ['Chỉ booking đang active mới chỉnh được meet URL.']]);
        }

        $previous = $booking->meet_url;
        if ($previous === $meetUrl) {
            return $booking->fresh(['slot', 'profile.account']);
        }

        $booking->update(['meet_url' => $meetUrl]);

        $startsAt = $booking->slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');
        if ($meetUrl === null) {
            $title = 'Link buổi học đã bị gỡ';
            $body = "Trung tâm đã gỡ link phòng học cho buổi {$startsAt}. Vui lòng chờ link mới.";
        } elseif ($previous === null) {
            $title = 'Đã có link phòng học';
            $body = "Buổi học {$startsAt} đã có link phòng học. Bấm vào để xem chi tiết.";
        } else {
            $title = 'Link phòng học đã được cập nhật';
            $body = "Trung tâm đã cập nhật link phòng học cho buổi {$startsAt}.";
        }

        $notification = $this->notification->push(
            $booking->profile,
            type: NotificationType::BookingMeetUrlUpdated,
            title: $title,
            body: $body,
            iconKey: IconKey::Calendar,
            payload: ['booking_id' => $booking->id, 'meet_url' => $meetUrl],
            dedupKey: "booking_meet_url:{$booking->id}:".md5((string) $meetUrl),
        );

        if ($notification !== null) {
            $this->email->sendToProfile(
                $booking->profile,
                $title,
                [$body],
                'Xem lịch hẹn',
                "/khoa-hoc/{$booking->slot->course_id}/dat-lich-1-1",
            );
        }

        return $booking->fresh(['slot', 'profile.account']);
    }

    public function rescheduleBooking(TeacherBooking $booking, TeacherSlot $targetSlot): TeacherBooking
    {
        $result = DB::transaction(function () use ($booking, $targetSlot) {
            /** @var TeacherBooking $locked */
            $locked = TeacherBooking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== BookingStatus::Booked) {
                throw ValidationException::withMessages(['booking' => ['Chỉ booking đang đặt mới dời lịch được.']]);
            }

            $locked->loadMissing(['slot', 'profile']);
            $oldSlot = $locked->slot;
            if ($oldSlot === null) {
                throw ValidationException::withMessages(['booking' => ['Booking không còn slot gốc.']]);
            }

            /** @var TeacherSlot $newSlot */
            $newSlot = TeacherSlot::query()
                ->whereKey($targetSlot->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($newSlot->course_id !== $oldSlot->course_id) {
                throw ValidationException::withMessages(['target_slot_id' => ['Slot mới phải thuộc cùng khóa học.']]);
            }
            if ($newSlot->status !== SlotStatus::Open) {
                throw ValidationException::withMessages(['target_slot_id' => ['Slot mới không còn trống.']]);
            }
            if ($newSlot->starts_at->isPast()) {
                throw ValidationException::withMessages(['target_slot_id' => ['Slot mới đã qua.']]);
            }

            $oldSlot->update(['status' => SlotStatus::Open]);
            $newSlot->update(['status' => SlotStatus::Booked]);
            $locked->update(['slot_id' => $newSlot->id, 'meet_url' => null]);

            return [$locked->fresh(['slot', 'profile.account']), $oldSlot->fresh(), $newSlot->fresh()];
        });

        /** @var TeacherBooking $updated */
        [$updated, $oldSlot, $newSlot] = $result;
        $profile = $updated->profile;

        $notification = $this->notification->push(
            $profile,
            type: NotificationType::BookingRescheduled,
            title: 'Lịch học 1-1 đã được dời',
            body: "Lịch hẹn mới: {$newSlot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i')}.",
            iconKey: IconKey::Calendar,
            payload: ['booking_id' => $updated->id, 'slot_id' => $newSlot->id],
            dedupKey: "booking_rescheduled:{$updated->id}:{$newSlot->id}",
        );

        if ($notification !== null) {
            $this->email->sendLearnerBookingRescheduled($profile, $oldSlot, $newSlot);
        }

        return $updated;
    }

    public function cancelBooking(TeacherBooking $booking): TeacherBooking
    {
        $booking = DB::transaction(function () use ($booking) {
            /** @var TeacherBooking $locked */
            $locked = TeacherBooking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status === BookingStatus::Cancelled) {
                throw ValidationException::withMessages(['booking' => ['Booking đã hủy rồi.']]);
            }

            $locked->loadMissing(['slot', 'profile']);
            $locked->update(['status' => BookingStatus::Cancelled, 'cancelled_at' => now()]);

            $slot = $locked->slot;
            if ($slot && $slot->status === SlotStatus::Booked) {
                $slot->update(['status' => SlotStatus::Open]);
            }

            $coinTx = CoinTransaction::query()
                ->where('source_type', CoinSourceType::TeacherBooking->value)
                ->where('source_id', $locked->id)
                ->where('type', CoinTransactionType::TeacherBooking)
                ->first();

            $alreadyRefunded = CoinTransaction::query()
                ->where('source_type', CoinSourceType::TeacherBooking->value)
                ->where('source_id', $locked->id)
                ->where('type', CoinTransactionType::Refund)
                ->exists();

            if ($coinTx && ! $alreadyRefunded) {
                $amount = abs((int) $coinTx->delta);
                if ($amount > 0) {
                    $this->wallet->credit(
                        $locked->profile,
                        $amount,
                        CoinTransactionType::Refund,
                        $locked,
                        ['reason' => 'booking_cancelled'],
                    );
                }
            }

            return $locked;
        });

        $notification = $this->notification->push(
            $booking->profile,
            type: NotificationType::BookingCancelled,
            title: 'Buổi học đã bị hủy',
            body: "Buổi học {$booking->slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i')} đã bị hủy bởi trung tâm.",
            iconKey: IconKey::Alert,
            dedupKey: "booking_cancelled:{$booking->id}",
        );

        if ($notification !== null) {
            $this->email->sendToProfile(
                $booking->profile,
                'Buổi học 1-1 đã bị hủy',
                [
                    "Buổi học {$booking->slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i')} đã bị hủy bởi trung tâm.",
                    'Nếu bạn đã bị trừ xu cho lịch hẹn này, hệ thống sẽ hoàn lại xu theo chính sách hiện tại.',
                    $this->email->supportLine(),
                ],
                'Xem lịch hẹn',
                "/khoa-hoc/{$booking->slot->course_id}/dat-lich-1-1",
            );
        }

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

    private function guardSlotConflict(Course $course, CarbonImmutable $startsAt, int $durationMinutes, ?string $exceptId = null): void
    {
        if ($this->slotConflicts($course, $startsAt, $durationMinutes, $exceptId)) {
            throw ValidationException::withMessages(['starts_at' => ['Giáo viên đã có slot 1-1 khác trùng khung giờ này.']]);
        }
    }

    private function slotConflicts(Course $course, CarbonImmutable $startsAt, int $durationMinutes, ?string $exceptId = null): bool
    {
        $endsAt = $startsAt->addMinutes($durationMinutes);
        $query = TeacherSlot::query()
            ->where('teacher_id', $course->teacher_id)
            ->where('starts_at', '<', $endsAt)
            ->whereRaw("starts_at + (duration_minutes * interval '1 minute') > ?", [$startsAt]);
        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        return $query->exists();
    }

    /** @param array<int, array{starts_at: CarbonImmutable, duration_minutes: int}> $rows */
    private function candidateOverlapsRows(CarbonImmutable $startsAt, int $durationMinutes, array $rows): bool
    {
        $endsAt = $startsAt->addMinutes($durationMinutes);

        foreach ($rows as $row) {
            $rowStart = $row['starts_at'];
            $rowEnd = $rowStart->addMinutes($row['duration_minutes']);
            if ($rowStart->lt($endsAt) && $rowEnd->gt($startsAt)) {
                return true;
            }
        }

        return false;
    }

    private function guardSlotDoesNotOverlapSchedule(Course $course, CarbonImmutable $startsAt, int $durationMinutes): void
    {
        if ($this->slotOverlapsSchedule($course, $startsAt, $durationMinutes)) {
            throw ValidationException::withMessages([
                'starts_at' => ['Khung giờ này trùng với buổi học chính của giáo viên.'],
            ]);
        }
    }

    private function slotOverlapsSchedule(Course $course, CarbonImmutable $startsAt, int $durationMinutes): bool
    {
        $tz = 'Asia/Ho_Chi_Minh';
        $slotStart = $startsAt->setTimezone($tz);
        $slotEnd = $slotStart->addMinutes($durationMinutes);

        return CourseScheduleItem::query()
            ->whereDate('date', $slotStart->toDateString())
            ->where('status', '!=', 'cancelled')
            ->whereHas('course', fn ($q) => $q->where('teacher_id', $course->teacher_id))
            ->get(['date', 'start_time', 'end_time'])
            ->contains(function (CourseScheduleItem $item) use ($slotStart, $slotEnd, $tz): bool {
                $itemStart = CarbonImmutable::parse($item->date->toDateString().' '.substr((string) $item->start_time, 0, 5), $tz);
                $itemEnd = CarbonImmutable::parse($item->date->toDateString().' '.substr((string) $item->end_time, 0, 5), $tz);

                return $itemStart->lt($slotEnd) && $itemEnd->gt($slotStart);
            });
    }

    private function guardSlotHasActiveBooking(TeacherSlot $slot, string $message): void
    {
        if ($slot->bookings()->whereIn('status', BookingStatus::activeValues())->exists()) {
            throw ValidationException::withMessages(['slot' => [$message]]);
        }
    }
}
