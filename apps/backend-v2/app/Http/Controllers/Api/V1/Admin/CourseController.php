<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Course\StoreCourseRequest;
use App\Http\Requests\Admin\Course\StoreScheduleItemRequest;
use App\Http\Requests\Admin\Course\UpdateCourseRequest;
use App\Http\Requests\Admin\Course\UpdateScheduleItemRequest;
use App\Http\Resources\Admin\AdminCourseResource;
use App\Http\Resources\Admin\AdminEnrollmentResource;
use App\Http\Resources\Admin\AdminScheduleItemResource;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Services\Admin\AdminCourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class CourseController extends Controller
{
    public function __construct(private readonly AdminCourseService $service) {}

    public function index(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $filters = [
            'q' => $request->string('q')->toString() ?: null,
            'target_level' => $request->string('target_level')->toString() ?: null,
            'teacher_id' => $request->string('teacher_id')->toString() ?: null,
        ];

        if ($request->has('is_published')) {
            $filters['is_published'] = filter_var(
                $request->input('is_published'),
                FILTER_VALIDATE_BOOL,
                FILTER_NULL_ON_FAILURE,
            );
        }

        return AdminCourseResource::collection(
            $this->service->list($filters)->paginate($perPage),
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $course = $this->service->create($request->validated());

        return (new AdminCourseResource($course->load('teacher')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(string $id): AdminCourseResource
    {
        /** @var Course $course */
        $course = Course::query()
            ->with('teacher')
            ->withCount(['enrollments', 'scheduleItems'])
            ->findOrFail($id);

        return new AdminCourseResource($course);
    }

    public function update(UpdateCourseRequest $request, string $id): AdminCourseResource
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);

        return new AdminCourseResource($this->service->update($course, $request->validated()));
    }

    public function destroy(string $id): Response
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        $this->service->delete($course);

        return response()->noContent();
    }

    public function publish(string $id): AdminCourseResource
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);

        return new AdminCourseResource($this->service->setPublished($course, true));
    }

    public function unpublish(string $id): AdminCourseResource
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);

        return new AdminCourseResource($this->service->setPublished($course, false));
    }

    // ─── Schedule items ───────────────────────────────────

    public function indexScheduleItems(string $id): AnonymousResourceCollection
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        $items = $course->scheduleItems()
            ->orderBy('session_number')
            ->orderBy('date')
            ->get();

        return AdminScheduleItemResource::collection($items);
    }

    public function storeScheduleItem(StoreScheduleItemRequest $request, string $id): JsonResponse
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        $item = $this->service->createScheduleItem($course, $request->validated());

        return (new AdminScheduleItemResource($item))->response()->setStatusCode(201);
    }

    public function updateScheduleItem(UpdateScheduleItemRequest $request, string $itemId): AdminScheduleItemResource
    {
        /** @var CourseScheduleItem $item */
        $item = CourseScheduleItem::query()->findOrFail($itemId);

        return new AdminScheduleItemResource(
            $this->service->updateScheduleItem($item, $request->validated()),
        );
    }

    public function destroyScheduleItem(string $itemId): Response
    {
        /** @var CourseScheduleItem $item */
        $item = CourseScheduleItem::query()->findOrFail($itemId);
        $this->service->deleteScheduleItem($item);

        return response()->noContent();
    }

    // ─── Enrollments (read-only) ───────────────────────────

    public function indexEnrollments(Request $request, string $id): ResourceCollection
    {
        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        return AdminEnrollmentResource::collection(
            $this->service->listEnrollments($course)->paginate($perPage),
        );
    }

    public function storeEnrollment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'profile_id' => ['required', 'uuid', 'exists:profiles,id'],
        ]);

        /** @var Course $course */
        $course = Course::query()->findOrFail($id);
        /** @var Profile $profile */
        $profile = Profile::query()->findOrFail($validated['profile_id']);

        $enrollment = $this->service->enrollProfile($course, $profile);

        return (new AdminEnrollmentResource($enrollment))->response()->setStatusCode(201);
    }

    public function destroyEnrollment(string $enrollmentId): Response
    {
        /** @var CourseEnrollment $enrollment */
        $enrollment = CourseEnrollment::query()->findOrFail($enrollmentId);
        $this->service->deleteEnrollment($enrollment);

        return response()->noContent();
    }

    public function setEnrollmentCommitment(Request $request, string $enrollmentId): AdminEnrollmentResource
    {
        $validated = $request->validate([
            'acknowledged_commitment' => ['required', 'boolean'],
        ]);

        /** @var CourseEnrollment $enrollment */
        $enrollment = CourseEnrollment::query()->findOrFail($enrollmentId);

        return new AdminEnrollmentResource(
            $this->service->setEnrollmentCommitment($enrollment, (bool) $validated['acknowledged_commitment']),
        );
    }
}
