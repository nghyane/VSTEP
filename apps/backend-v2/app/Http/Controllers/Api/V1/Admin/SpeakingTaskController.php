<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SpeakingTask\StoreTaskRequest;
use App\Http\Requests\Admin\SpeakingTask\UpdateTaskRequest;
use App\Http\Resources\Admin\AdminSpeakingTaskResource;
use App\Models\PracticeSpeakingTask;
use App\Services\Admin\AdminSpeakingTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class SpeakingTaskController extends Controller
{
    public function __construct(private readonly AdminSpeakingTaskService $service) {}

    public function indexTasks(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $filters = [
            'q' => $request->string('q')->toString() ?: null,
            'part' => $request->integer('part') ?: null,
        ];

        if ($request->has('is_published')) {
            $filters['is_published'] = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        }

        return AdminSpeakingTaskResource::collection(
            $this->service->list($filters)->paginate($perPage),
        );
    }

    public function storeTask(StoreTaskRequest $request): JsonResponse
    {
        $task = $this->service->createTask($request->validated());

        return (new AdminSpeakingTaskResource($task))->response()->setStatusCode(201);
    }

    public function showTask(string $id): AdminSpeakingTaskResource
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);

        return new AdminSpeakingTaskResource($task);
    }

    public function updateTask(UpdateTaskRequest $request, string $id): AdminSpeakingTaskResource
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);

        return new AdminSpeakingTaskResource($this->service->updateTask($task, $request->validated()));
    }

    public function destroyTask(string $id): Response
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);
        $this->service->deleteTask($task);

        return response()->noContent();
    }

    public function publishTask(string $id): AdminSpeakingTaskResource
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);

        return new AdminSpeakingTaskResource($this->service->setPublished($task, true));
    }

    public function unpublishTask(string $id): AdminSpeakingTaskResource
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);

        return new AdminSpeakingTaskResource($this->service->setPublished($task, false));
    }
}
