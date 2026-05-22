<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Concerns\ResolvesPublishedFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Writing\StoreMarkerRequest;
use App\Http\Requests\Admin\Writing\StorePromptRequest;
use App\Http\Requests\Admin\Writing\UpdateMarkerRequest;
use App\Http\Requests\Admin\Writing\UpdatePromptRequest;
use App\Http\Resources\Admin\AdminWritingMarkerResource;
use App\Http\Resources\Admin\AdminWritingPromptResource;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSampleMarker;
use App\Services\Admin\AdminWritingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class WritingController extends Controller
{
    use ResolvesPublishedFilter;

    public function __construct(private readonly AdminWritingService $service) {}

    public function indexPrompts(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $filters = [
            'q' => $request->string('q')->toString() ?: null,
            'part' => $request->integer('part') ?: null,
        ];

        if ($request->has('is_published')) {
            $filters['is_published'] = $this->resolvePublishedFilter($request);
        }

        return AdminWritingPromptResource::collection(
            $this->service->list($filters)->paginate($perPage),
        );
    }

    public function storePrompt(StorePromptRequest $request): JsonResponse
    {
        $prompt = $this->service->createPrompt($request->validated());

        return (new AdminWritingPromptResource($prompt))->response()->setStatusCode(201);
    }

    public function showPrompt(string $id): JsonResponse
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()
            ->with(['sampleMarkers' => fn ($q) => $q->orderBy('display_order')])
            ->withCount('sampleMarkers')
            ->findOrFail($id);

        return response()->json(['data' => [
            'prompt' => (new AdminWritingPromptResource($prompt))->resolve(request()),
            'markers' => AdminWritingMarkerResource::collection($prompt->sampleMarkers)->resolve(request()),
        ]]);
    }

    public function updatePrompt(UpdatePromptRequest $request, string $id): AdminWritingPromptResource
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);

        return new AdminWritingPromptResource($this->service->updatePrompt($prompt, $request->validated()));
    }

    public function destroyPrompt(string $id): Response
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);
        $this->service->deletePrompt($prompt);

        return response()->noContent();
    }

    public function publishPrompt(string $id): AdminWritingPromptResource
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);

        return new AdminWritingPromptResource($this->service->setPublished($prompt, true));
    }

    public function unpublishPrompt(string $id): AdminWritingPromptResource
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);

        return new AdminWritingPromptResource($this->service->setPublished($prompt, false));
    }

    // ─── Sample markers ─────────────────────────────────────

    public function indexMarkers(string $id): AnonymousResourceCollection
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);

        return AdminWritingMarkerResource::collection(
            $prompt->sampleMarkers()->orderBy('display_order')->get(),
        );
    }

    public function storeMarker(StoreMarkerRequest $request, string $id): JsonResponse
    {
        /** @var PracticeWritingPrompt $prompt */
        $prompt = PracticeWritingPrompt::query()->findOrFail($id);
        $marker = $this->service->createMarker($prompt, $request->validated());

        return (new AdminWritingMarkerResource($marker))->response()->setStatusCode(201);
    }

    public function updateMarker(UpdateMarkerRequest $request, string $markerId): AdminWritingMarkerResource
    {
        /** @var PracticeWritingSampleMarker $marker */
        $marker = PracticeWritingSampleMarker::query()->findOrFail($markerId);

        return new AdminWritingMarkerResource($this->service->updateMarker($marker, $request->validated()));
    }

    public function destroyMarker(string $markerId): Response
    {
        /** @var PracticeWritingSampleMarker $marker */
        $marker = PracticeWritingSampleMarker::query()->findOrFail($markerId);
        $this->service->deleteMarker($marker);

        return response()->noContent();
    }
}
