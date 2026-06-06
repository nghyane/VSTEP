<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TeacherGrading\AssignTeacherGradingRequest;
use App\Http\Requests\Admin\TeacherGrading\RejectTeacherGradingRequest;
use App\Http\Requests\Admin\TeacherGrading\SubmitTeacherGradingResultRequest;
use App\Http\Resources\TeacherGradingRequestResource;
use App\Services\Contracts\TeacherGradingRequestServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Validation\Rule;

final class TeacherGradingRequestController extends Controller
{
    public function __construct(
        private readonly TeacherGradingRequestServiceInterface $service,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $validated = $request->validate($this->listRules());
        $perPage = (int) ($validated['per_page'] ?? 20);

        return TeacherGradingRequestResource::collection($this->service->listForStaff($validated, $perPage));
    }

    public function show(string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->showForStaff($requestId));
    }

    public function assign(AssignTeacherGradingRequest $request, string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->assign(
            $requestId,
            $request->validated('teacher_id'),
            $request->user(),
            $request->validated('staff_note'),
            $request->validated('due_at'),
            $request->validated('priority'),
        ));
    }

    public function reject(RejectTeacherGradingRequest $request, string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->reject(
            $requestId,
            $request->user(),
            $request->validated('staff_note'),
        ));
    }

    public function teacherIndex(Request $request): ResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in($this->statuses())],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $perPage = (int) ($validated['per_page'] ?? 20);

        return TeacherGradingRequestResource::collection($this->service->listForTeacher($request->user(), $validated, $perPage));
    }

    public function teacherShow(Request $request, string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->showForTeacher($request->user(), $requestId));
    }

    public function start(Request $request, string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->start($request->user(), $requestId));
    }

    public function submit(SubmitTeacherGradingResultRequest $request, string $requestId): TeacherGradingRequestResource
    {
        return new TeacherGradingRequestResource($this->service->submitResult(
            $request->user(),
            $requestId,
            $request->validated('criterion_scores'),
            $request->validated('feedback'),
        ));
    }

    private function listRules(): array
    {
        return [
            'status' => ['nullable', 'string', Rule::in($this->statuses())],
            'teacher_id' => ['nullable', 'uuid'],
            'skill' => ['nullable', 'string', Rule::in(['writing', 'speaking'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    private function statuses(): array
    {
        return [
            'pending_assignment',
            'assigned',
            'in_progress',
            'completed',
            'cancelled',
            'rejected',
        ];
    }
}
