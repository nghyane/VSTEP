<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Course\StoreCourseRequest;
use App\Http\Requests\Admin\Course\UpdateCourseRequest;
use App\Http\Resources\Admin\AdminCourseResource;
use App\Models\Course;
use App\Services\Admin\AdminCourseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
}
