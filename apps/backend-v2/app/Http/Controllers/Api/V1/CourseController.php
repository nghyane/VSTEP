<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Services\CourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(private readonly CourseService $courseService) {}

    public function index(Request $request): JsonResponse
    {
        $courses = $this->courseService->listPublished();
        $profile = $request->attributes->get('active_profile');
        $enrolledIds = $profile
            ? CourseEnrollment::query()->where('profile_id', $profile->id)->pluck('course_id')->all()
            : [];

        return response()->json([
            'data' => $courses,
            'enrolled_course_ids' => $enrolledIds,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $course = $this->courseService->getDetail($id);
        $profile = request()->attributes->get('active_profile');
        $commitment = $profile ? $this->courseService->commitmentStatus($profile, $course) : null;

        return response()->json(['data' => [
            'course' => $course,
            'sold_slots' => $course->soldSlots(),
            'commitment' => $commitment,
        ]]);
    }

    public function enroll(Request $request, string $id): JsonResponse
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        $enrollment = $this->courseService->enroll($this->profile($request), $course);

        return response()->json(['data' => [
            'enrollment_id' => $enrollment->id,
            'bonus_received' => $enrollment->bonus_coins_received,
        ]], 201);
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
            'slot_starts_at' => $slot->starts_at,
            'meet_url' => $booking->meet_url,
        ]], 201);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
