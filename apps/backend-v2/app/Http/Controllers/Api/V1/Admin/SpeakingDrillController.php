<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SpeakingDrill\StoreDrillRequest;
use App\Http\Requests\Admin\SpeakingDrill\StoreSentenceRequest;
use App\Http\Requests\Admin\SpeakingDrill\UpdateDrillRequest;
use App\Http\Requests\Admin\SpeakingDrill\UpdateSentenceRequest;
use App\Http\Resources\Admin\AdminSpeakingDrillResource;
use App\Http\Resources\Admin\AdminSpeakingDrillSentenceResource;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use App\Services\Admin\AdminSpeakingDrillService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class SpeakingDrillController extends Controller
{
    public function __construct(private readonly AdminSpeakingDrillService $service) {}

    public function indexDrills(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $filters = [
            'q' => $request->string('q')->toString() ?: null,
            'level' => $request->string('level')->toString() ?: null,
        ];

        if ($request->has('is_published')) {
            $filters['is_published'] = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        }

        return AdminSpeakingDrillResource::collection(
            $this->service->list($filters)->paginate($perPage),
        );
    }

    public function storeDrill(StoreDrillRequest $request): JsonResponse
    {
        $drill = $this->service->createDrill($request->validated());

        return (new AdminSpeakingDrillResource($drill))->response()->setStatusCode(201);
    }

    public function showDrill(string $id): JsonResponse
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()
            ->with(['sentences' => fn ($q) => $q->orderBy('display_order')])
            ->withCount('sentences')
            ->findOrFail($id);

        return response()->json(['data' => [
            'drill' => (new AdminSpeakingDrillResource($drill))->resolve(request()),
            'sentences' => AdminSpeakingDrillSentenceResource::collection($drill->sentences)->resolve(request()),
        ]]);
    }

    public function updateDrill(UpdateDrillRequest $request, string $id): AdminSpeakingDrillResource
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);

        return new AdminSpeakingDrillResource($this->service->updateDrill($drill, $request->validated()));
    }

    public function destroyDrill(string $id): Response
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);
        $this->service->deleteDrill($drill);

        return response()->noContent();
    }

    public function publishDrill(string $id): AdminSpeakingDrillResource
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);

        return new AdminSpeakingDrillResource($this->service->setPublished($drill, true));
    }

    public function unpublishDrill(string $id): AdminSpeakingDrillResource
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);

        return new AdminSpeakingDrillResource($this->service->setPublished($drill, false));
    }

    public function indexSentences(string $id): AnonymousResourceCollection
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);

        return AdminSpeakingDrillSentenceResource::collection(
            $drill->sentences()->orderBy('display_order')->get(),
        );
    }

    public function storeSentence(StoreSentenceRequest $request, string $id): JsonResponse
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($id);
        $sentence = $this->service->createSentence($drill, $request->validated());

        return (new AdminSpeakingDrillSentenceResource($sentence))->response()->setStatusCode(201);
    }

    public function updateSentence(UpdateSentenceRequest $request, string $sentenceId): AdminSpeakingDrillSentenceResource
    {
        /** @var PracticeSpeakingDrillSentence $sentence */
        $sentence = PracticeSpeakingDrillSentence::query()->findOrFail($sentenceId);

        return new AdminSpeakingDrillSentenceResource($this->service->updateSentence($sentence, $request->validated()));
    }

    public function destroySentence(string $sentenceId): Response
    {
        /** @var PracticeSpeakingDrillSentence $sentence */
        $sentence = PracticeSpeakingDrillSentence::query()->findOrFail($sentenceId);
        $this->service->deleteSentence($sentence);

        return response()->noContent();
    }
}
