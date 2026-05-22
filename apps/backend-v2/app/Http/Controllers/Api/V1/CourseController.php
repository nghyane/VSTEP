<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Services\CourseOrderService;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
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

    public function show(Request $request, string $id): JsonResponse
    {
        $course = $this->courseService->getDetail($id);
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
    public function createEnrollmentOrder(Request $request, string $id): JsonResponse
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);

        $order = $this->courseOrderService->createOrder(
            $this->profile($request),
            $course,
            'mock',
        );

        return response()->json(['data' => $this->formatOrder($order)], 201);
    }

    /**
     * Confirm payment (mock). Creates enrollment + credits bonus coins.
     */
    public function confirmEnrollmentOrder(Request $request, string $orderId): JsonResponse
    {
        $validated = $request->validate([
            // SVG do signature pad sinh; ~5KB/chữ ký bình thường. Cap 50KB cho
            // safe (chống abuse paste payload to). starts_with để loại payload
            // lạ ngoài SVG.
            'commitment_signature' => ['nullable', 'string', 'max:51200', 'starts_with:<svg'],
        ]);

        $order = CourseEnrollmentOrder::query()->findOrFail($orderId);
        if ($order->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        $confirmed = $this->courseOrderService->confirm($order, $validated['commitment_signature'] ?? null);

        return response()->json(['data' => $this->formatOrder($confirmed)]);
    }

    /**
     * List enrollment orders for current profile.
     */
    public function enrollmentOrders(Request $request): JsonResponse
    {
        $orders = $this->courseOrderService->getProfileOrders($this->profile($request));

        return response()->json([
            'data' => $orders->map(fn (CourseEnrollmentOrder $o) => $this->formatOrder($o)),
        ]);
    }

    private function formatOrder(CourseEnrollmentOrder $order): array
    {
        return [
            'id' => $order->id,
            'course_id' => $order->course_id,
            'course_title' => $order->course?->title,
            'amount_vnd' => $order->amount_vnd,
            'status' => $order->status,
            'payment_provider' => $order->payment_provider,
            'paid_at' => $order->paid_at,
            'created_at' => $order->created_at,
        ];
    }

    /**
     * Booking page payload (teacher + slots + my_bookings_count) cho FE 1-1 booking flow.
     */
    public function bookings(Request $request, string $courseId): JsonResponse
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($courseId);

        return response()->json([
            'data' => $this->courseService->getBookingPageData($this->profile($request), $course),
        ]);
    }

    public function bookSlot(Request $request, string $courseId): JsonResponse
    {
        $request->validate([
            'slot_id' => ['required', 'uuid'],
            'submission_type' => ['nullable', 'string'],
            'submission_id' => ['nullable', 'uuid'],
        ]);
        /** @var Course $course */
        $course = Course::query()->findOrFail($courseId);
        /** @var TeacherSlot $slot */
        $slot = TeacherSlot::query()->findOrFail($request->input('slot_id'));

        $booking = $this->courseService->bookSlot(
            $this->profile($request), $course, $slot,
            $request->input('submission_type'), $request->input('submission_id'),
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

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
