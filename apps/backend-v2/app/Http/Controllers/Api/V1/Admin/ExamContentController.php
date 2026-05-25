<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExamContent\StoreListeningSectionRequest;
use App\Http\Requests\Admin\ExamContent\StoreMcqItemRequest;
use App\Http\Requests\Admin\ExamContent\StoreReadingPassageRequest;
use App\Http\Requests\Admin\ExamContent\StoreSpeakingPartRequest;
use App\Http\Requests\Admin\ExamContent\StoreWritingTaskRequest;
use App\Http\Requests\Admin\ExamContent\UpdateListeningSectionRequest;
use App\Http\Requests\Admin\ExamContent\UpdateMcqItemRequest;
use App\Http\Requests\Admin\ExamContent\UpdateReadingPassageRequest;
use App\Http\Requests\Admin\ExamContent\UpdateSpeakingPartRequest;
use App\Http\Requests\Admin\ExamContent\UpdateWritingTaskRequest;
use App\Http\Resources\Admin\AdminListeningSectionResource;
use App\Http\Resources\Admin\AdminMcqItemResource;
use App\Http\Resources\Admin\AdminReadingPassageResource;
use App\Http\Resources\Admin\AdminSpeakingPartResource;
use App\Http\Resources\Admin\AdminWritingTaskResource;
use App\Models\ExamVersion;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionListeningSection;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamVersionReadingPassage;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Services\Admin\AdminExamContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class ExamContentController extends Controller
{
    public function __construct(
        private readonly AdminExamContentService $service,
    ) {}

    // ─── Listening Sections ───

    public function storeListeningSection(StoreListeningSectionRequest $request, string $versionId): JsonResponse
    {
        $version = ExamVersion::findOrFail($versionId);
        $section = $this->service->createListeningSection($version, $request->validated());

        return (new AdminListeningSectionResource($section))
            ->response()->setStatusCode(201);
    }

    public function updateListeningSection(UpdateListeningSectionRequest $request, string $sectionId): JsonResponse
    {
        $section = ExamVersionListeningSection::findOrFail($sectionId);
        $section = $this->service->updateListeningSection($section, $request->validated());

        return (new AdminListeningSectionResource($section))->response();
    }

    public function destroyListeningSection(string $sectionId): Response
    {
        $section = ExamVersionListeningSection::findOrFail($sectionId);
        $this->service->deleteListeningSection($section);

        return response()->noContent();
    }

    // ─── Listening Items ───

    public function storeListeningItem(StoreMcqItemRequest $request, string $sectionId): JsonResponse
    {
        $section = ExamVersionListeningSection::findOrFail($sectionId);
        $item = $this->service->createListeningItem($section, $request->validated());

        return (new AdminMcqItemResource($item))
            ->response()->setStatusCode(201);
    }

    public function updateListeningItem(UpdateMcqItemRequest $request, string $itemId): JsonResponse
    {
        $item = ExamVersionListeningItem::findOrFail($itemId);
        $item = $this->service->updateListeningItem($item, $request->validated());

        return (new AdminMcqItemResource($item))->response();
    }

    public function destroyListeningItem(string $itemId): Response
    {
        $item = ExamVersionListeningItem::findOrFail($itemId);
        $this->service->deleteListeningItem($item);

        return response()->noContent();
    }

    // ─── Reading Passages ───

    public function storeReadingPassage(StoreReadingPassageRequest $request, string $versionId): JsonResponse
    {
        $version = ExamVersion::findOrFail($versionId);
        $passage = $this->service->createReadingPassage($version, $request->validated());

        return (new AdminReadingPassageResource($passage))
            ->response()->setStatusCode(201);
    }

    public function updateReadingPassage(UpdateReadingPassageRequest $request, string $passageId): JsonResponse
    {
        $passage = ExamVersionReadingPassage::findOrFail($passageId);
        $passage = $this->service->updateReadingPassage($passage, $request->validated());

        return (new AdminReadingPassageResource($passage))->response();
    }

    public function destroyReadingPassage(string $passageId): Response
    {
        $passage = ExamVersionReadingPassage::findOrFail($passageId);
        $this->service->deleteReadingPassage($passage);

        return response()->noContent();
    }

    // ─── Reading Items ───

    public function storeReadingItem(StoreMcqItemRequest $request, string $passageId): JsonResponse
    {
        $passage = ExamVersionReadingPassage::findOrFail($passageId);
        $item = $this->service->createReadingItem($passage, $request->validated());

        return (new AdminMcqItemResource($item))
            ->response()->setStatusCode(201);
    }

    public function updateReadingItem(UpdateMcqItemRequest $request, string $itemId): JsonResponse
    {
        $item = ExamVersionReadingItem::findOrFail($itemId);
        $item = $this->service->updateReadingItem($item, $request->validated());

        return (new AdminMcqItemResource($item))->response();
    }

    public function destroyReadingItem(string $itemId): Response
    {
        $item = ExamVersionReadingItem::findOrFail($itemId);
        $this->service->deleteReadingItem($item);

        return response()->noContent();
    }

    // ─── Writing Tasks ───

    public function storeWritingTask(StoreWritingTaskRequest $request, string $versionId): JsonResponse
    {
        $version = ExamVersion::findOrFail($versionId);
        $task = $this->service->createWritingTask($version, $request->validated());

        return (new AdminWritingTaskResource($task))
            ->response()->setStatusCode(201);
    }

    public function updateWritingTask(UpdateWritingTaskRequest $request, string $taskId): JsonResponse
    {
        $task = ExamVersionWritingTask::findOrFail($taskId);
        $task = $this->service->updateWritingTask($task, $request->validated());

        return (new AdminWritingTaskResource($task))->response();
    }

    public function destroyWritingTask(string $taskId): Response
    {
        $task = ExamVersionWritingTask::findOrFail($taskId);
        $this->service->deleteWritingTask($task);

        return response()->noContent();
    }

    // ─── Speaking Parts ───

    public function storeSpeakingPart(StoreSpeakingPartRequest $request, string $versionId): JsonResponse
    {
        $version = ExamVersion::findOrFail($versionId);
        $part = $this->service->createSpeakingPart($version, $request->validated());

        return (new AdminSpeakingPartResource($part))
            ->response()->setStatusCode(201);
    }

    public function updateSpeakingPart(UpdateSpeakingPartRequest $request, string $partId): JsonResponse
    {
        $part = ExamVersionSpeakingPart::findOrFail($partId);
        $part = $this->service->updateSpeakingPart($part, $request->validated());

        return (new AdminSpeakingPartResource($part))->response();
    }

    public function destroySpeakingPart(string $partId): Response
    {
        $part = ExamVersionSpeakingPart::findOrFail($partId);
        $this->service->deleteSpeakingPart($part);

        return response()->noContent();
    }
}
