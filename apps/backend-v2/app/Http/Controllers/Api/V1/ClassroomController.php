<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Classroom\CreateAssignmentRequest;
use App\Http\Requests\Classroom\CreateClassroomRequest;
use App\Http\Requests\Classroom\GradeSubmissionRequest;
use App\Http\Requests\Classroom\JoinClassroomRequest;
use App\Http\Requests\Classroom\SendFeedbackRequest;
use App\Http\Requests\Classroom\UpdateClassroomRequest;
use App\Http\Resources\ClassAssignmentResource;
use App\Http\Resources\ClassAssignmentSubmissionResource;
use App\Http\Resources\ClassFeedbackResource;
use App\Http\Resources\ClassroomDetailResource;
use App\Http\Resources\ClassroomResource;
use App\Models\ClassAssignment;
use App\Models\ClassAssignmentSubmission;
use App\Models\Classroom;
use App\Services\ClassroomService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ClassroomController extends Controller
{
    public function __construct(
        private readonly ClassroomService $service,
    ) {}

    public function index(Request $request)
    {
        return ClassroomResource::collection(
            $this->service->list($request->user()),
        );
    }

    public function show(Request $request, Classroom $classroom)
    {
        Gate::authorize('view', $classroom);

        return new ClassroomDetailResource(
            $this->service->show($classroom),
        );
    }

    public function store(CreateClassroomRequest $request)
    {
        $this->authorizeInstructor($request);

        return new ClassroomResource(
            $this->service->create($request->validated(), $request->user()),
        );
    }

    public function update(UpdateClassroomRequest $request, Classroom $classroom)
    {
        Gate::authorize('update', $classroom);

        return new ClassroomResource(
            $this->service->update($classroom, $request->validated()),
        );
    }

    public function destroy(Request $request, Classroom $classroom)
    {
        Gate::authorize('delete', $classroom);

        $this->service->delete($classroom);

        return response()->json(['data' => ['id' => $classroom->id]]);
    }

    public function rotateCode(Request $request, Classroom $classroom)
    {
        Gate::authorize('update', $classroom);

        return new ClassroomResource(
            $this->service->rotateCode($classroom),
        );
    }

    public function join(JoinClassroomRequest $request)
    {
        $classroom = $this->service->join(
            $request->validated('invite_code'),
            $request->user(),
        );

        return response()->json(['data' => [
            'class_id' => $classroom->id,
            'class_name' => $classroom->name,
        ]]);
    }

    public function leave(Request $request, Classroom $classroom)
    {
        $this->service->leave($classroom, $request->user());

        return response()->json(['data' => ['id' => $classroom->id]]);
    }

    public function removeMember(Request $request, Classroom $classroom, string $userId)
    {
        Gate::authorize('update', $classroom);

        $this->service->removeMember($classroom, $userId);

        return response()->json(['data' => ['id' => $userId]]);
    }

    public function dashboard(Request $request, Classroom $classroom)
    {
        Gate::authorize('update', $classroom);

        return response()->json([
            'data' => $this->service->dashboard($classroom),
        ]);
    }

    public function sendFeedback(SendFeedbackRequest $request, Classroom $classroom)
    {
        Gate::authorize('update', $classroom);

        return new ClassFeedbackResource(
            $this->service->sendFeedback($classroom, $request->validated(), $request->user()),
        );
    }

    public function listFeedback(Request $request, Classroom $classroom)
    {
        Gate::authorize('view', $classroom);

        return ClassFeedbackResource::collection(
            $this->service->listFeedback($classroom, $request->query('skill')),
        );
    }

    // ── Assignments ──

    public function listAssignments(Request $request, Classroom $classroom)
    {
        Gate::authorize('view', $classroom);

        return response()->json([
            'data' => ClassAssignmentResource::collection(
                $this->service->listAssignments($classroom),
            ),
        ]);
    }

    public function showAssignment(Request $request, Classroom $classroom, ClassAssignment $assignment)
    {
        Gate::authorize('view', $classroom);

        return new ClassAssignmentResource(
            $this->service->showAssignment($assignment),
        );
    }

    public function storeAssignment(CreateAssignmentRequest $request, Classroom $classroom)
    {
        Gate::authorize('update', $classroom);

        return new ClassAssignmentResource(
            $this->service->createAssignment($classroom, $request->validated()),
        );
    }

    public function destroyAssignment(Request $request, Classroom $classroom, ClassAssignment $assignment)
    {
        Gate::authorize('update', $classroom);

        $this->service->deleteAssignment($assignment);

        return response()->json(['data' => ['id' => $assignment->id]]);
    }

    public function startAssignment(Request $request, Classroom $classroom, ClassAssignment $assignment)
    {
        Gate::authorize('view', $classroom);

        return new ClassAssignmentSubmissionResource(
            $this->service->startAssignment($assignment, $request->user()),
        );
    }

    public function submitAnswer(Request $request, Classroom $classroom, ClassAssignment $assignment)
    {
        Gate::authorize('view', $classroom);

        $request->validate(['answer' => ['required', 'string', 'max:5242880']]); // 5MB for audio base64

        return new ClassAssignmentSubmissionResource(
            $this->service->submitAnswer($assignment, $request->user(), $request->input('answer')),
        );
    }

    public function gradeSubmission(GradeSubmissionRequest $request, Classroom $classroom, ClassAssignmentSubmission $submission)
    {
        Gate::authorize('update', $classroom);

        return new ClassAssignmentSubmissionResource(
            $this->service->gradeSubmission(
                $submission,
                (float) $request->validated('score'),
                $request->input('feedback'),
            ),
        );
    }

    public function showSubmission(Request $request, Classroom $classroom, ClassAssignmentSubmission $submission)
    {
        Gate::authorize('view', $classroom);

        return new ClassAssignmentSubmissionResource(
            $this->service->showSubmission($submission),
        );
    }

    // ── Leaderboard ──

    public function leaderboard(Request $request, Classroom $classroom)
    {
        Gate::authorize('view', $classroom);

        return response()->json([
            'data' => $this->service->leaderboard($classroom),
        ]);
    }

    private function authorizeInstructor(Request $request): void
    {
        $role = $request->user()->role;
        if (! $role->is(Role::Instructor)) {
            throw new AuthorizationException('Chỉ giảng viên mới có thể tạo lớp');
        }
    }
}
