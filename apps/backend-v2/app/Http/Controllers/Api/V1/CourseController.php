<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookSlotRequest;
use App\Http\Resources\EnrollmentOrderResource;
use App\Models\Course;
use App\Models\CourseEnrollmentOrder;
use App\Models\TeacherSlot;
use App\Services\CourseOrderService;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CourseController extends Controller
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly CourseOrderService $courseOrderService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $request->attributes->get('active_profile');

        return response()->json($this->courseService->listForProfile($profile));
    }

    public function show(Request $request, Course $course): JsonResponse
    {
        $course->loadMissing(['scheduleItems', 'enrollments', 'teacher:id,full_name,title,bio']);
        $profile = $request->attributes->get('active_profile');
        $commitment = $profile ? $this->courseService->commitmentStatus($profile, $course) : null;

        // Bảo mật: livestream_url là core asset của khóa, chỉ user đã ghi danh được thấy.
        $isEnrolled = $commitment !== null && $commitment['phase'] !== 'not_enrolled';
        if (! $isEnrolled) {
            $course->makeHidden('livestream_url');
        }

        // Course đã unpublish chỉ accessible cho học viên đã ghi danh (giữ
        // quyền xem chi tiết khóa họ đã mua) — người ngoài fetch trực tiếp
        // bằng id → 404 để không lộ thông tin khóa đang đóng.
        if (! $course->is_published && ! $isEnrolled) {
            abort(404);
        }

        return response()->json(['data' => [
            'course' => $course,
            'sold_slots' => $course->soldSlots(),
            'commitment' => $commitment,
        ]]);
    }

    // ── Enrollment Orders (VND payment) ──

    /**
     * Create enrollment order. Returns order with pending status.
     * FE uses order_id to confirm payment.
     */
    public function createEnrollmentOrder(Request $request, Course $course): JsonResponse
    {
        $order = $this->courseOrderService->createOrder(
            $request->profile(),
            $course,
            'mock',
        );

        return response()->json(['data' => EnrollmentOrderResource::make($order)], 201);
    }

    /**
     * Confirm payment (mock). Creates enrollment + credits bonus coins.
     */
    public function confirmEnrollmentOrder(Request $request, CourseEnrollmentOrder $enrollmentOrder): JsonResponse
    {
        $validated = $request->validate([
            'commitment_signature' => ['nullable', 'string', 'max:51200', 'starts_with:<svg'],
        ]);

        if ($enrollmentOrder->profile_id !== $request->profile()->id) {
            abort(403);
        }

        $confirmed = $this->courseOrderService->confirm($enrollmentOrder, $validated['commitment_signature'] ?? null);

        return response()->json(['data' => EnrollmentOrderResource::make($confirmed)]);
    }

    /**
     * List enrollment orders for current profile.
     */
    public function enrollmentOrders(Request $request): JsonResponse
    {
        return EnrollmentOrderResource::collection(
            $this->courseOrderService->getProfileOrders($request->profile())
        )->response();
    }

    /**
     * Booking page payload (teacher + slots + my_bookings_count) cho FE 1-1 booking flow.
     */
    public function bookings(Request $request, Course $course): JsonResponse
    {
        return response()->json([
            'data' => $this->courseService->getBookingPageData($request->profile(), $course),
        ]);
    }

    public function bookSlot(BookSlotRequest $request, Course $course): JsonResponse
    {
        $validated = $request->validated();
        $slot = TeacherSlot::query()->findOrFail($validated['slot_id']);

        $booking = $this->courseService->bookSlot(
            $request->profile(), $course, $slot,
            $validated['submission_type'] ?? null, $validated['submission_id'] ?? null,
        );

        return response()->json(['data' => [
            'booking_id' => $booking->id,
            'slot' => [
                'id' => $slot->id,
                'starts_at' => $slot->starts_at->toIso8601String(),
                'duration_minutes' => (int) $slot->duration_minutes,
                'status' => 'booked_me',
                'meet_url' => $booking->meet_url,
            ],
            'coins_charged' => (int) ($course->booking_coin_cost ?? CourseService::BOOKING_COIN_COST_FALLBACK),
        ]], 201);
    }
}
