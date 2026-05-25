<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Practice\StoreScenarioRequest;
use App\Http\Requests\Admin\Practice\UpdateScenarioRequest;
use App\Http\Resources\Admin\AdminSpeakingScenarioResource;
use App\Models\PracticeSpeakingScenario;
use App\Services\ConversationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class SpeakingScenarioController extends Controller
{
    public function __construct(
        private readonly ConversationServiceInterface $conversationService,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $query = PracticeSpeakingScenario::query()->orderByDesc('created_at');

        if ($q = $request->string('q')->toString()) {
            $query->where(fn ($qb) => $qb
                ->where('title', 'ilike', "%{$q}%")
                ->orWhere('slug', 'ilike', "%{$q}%"));
        }

        if ($level = $request->string('level')->toString()) {
            $query->where('level', $level);
        }

        if ($request->has('is_published')) {
            $val = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $query->where('is_published', $val);
            }
        }

        return AdminSpeakingScenarioResource::collection($query->paginate($perPage));
    }

    public function store(StoreScenarioRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Generate IPA for opening_line synchronously — cached on row so
        // runtime startSession doesn't need to call LLM. Failure is OK (nullable).
        $data['opening_line_ipa'] = $this->conversationService->generateIpa($data['opening_line']);

        $scenario = PracticeSpeakingScenario::query()->create($data);

        return (new AdminSpeakingScenarioResource($scenario))->response()->setStatusCode(201);
    }

    public function show(string $id): AdminSpeakingScenarioResource
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);

        return new AdminSpeakingScenarioResource($scenario);
    }

    public function update(UpdateScenarioRequest $request, string $id): AdminSpeakingScenarioResource
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);

        $data = $request->validated();

        // Re-generate IPA if opening_line changed.
        if (array_key_exists('opening_line', $data) && $data['opening_line'] !== $scenario->opening_line) {
            $data['opening_line_ipa'] = $this->conversationService->generateIpa($data['opening_line']);
        }

        $scenario->update($data);

        return new AdminSpeakingScenarioResource($scenario->fresh());
    }

    public function destroy(string $id): Response
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);
        $scenario->delete();

        return response()->noContent();
    }

    public function publish(string $id): AdminSpeakingScenarioResource
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);
        $scenario->update(['is_published' => true]);

        return new AdminSpeakingScenarioResource($scenario);
    }

    public function unpublish(string $id): AdminSpeakingScenarioResource
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);
        $scenario->update(['is_published' => false]);

        return new AdminSpeakingScenarioResource($scenario);
    }
}
