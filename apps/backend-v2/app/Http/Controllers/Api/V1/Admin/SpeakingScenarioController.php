<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminSpeakingScenarioResource;
use App\Models\PracticeSpeakingScenario;
use App\Services\SpeakingConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

final class SpeakingScenarioController extends Controller
{
    public function __construct(
        private readonly SpeakingConversationService $conversationService,
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'unique:practice_speaking_scenarios,slug'],
            'title' => ['required', 'string', 'max:200'],
            'level' => ['required', 'string', 'in:A1,A2,B1,B2,C1'],
            'character_name' => ['required', 'string', 'max:80'],
            'character_voice_label' => ['required', 'string', 'max:40'],
            'description' => ['required', 'string'],
            'system_prompt' => ['required', 'string'],
            'opening_line' => ['required', 'string'],
            'target_vocab' => ['nullable', 'array'],
            'target_vocab.*' => ['string'],
            'estimated_minutes' => ['required', 'integer', 'min:1'],
            'expected_turns' => ['required', 'integer', 'min:2'],
            'is_published' => ['nullable', 'boolean'],
        ]);

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

    public function update(Request $request, string $id): AdminSpeakingScenarioResource
    {
        /** @var PracticeSpeakingScenario $scenario */
        $scenario = PracticeSpeakingScenario::query()->findOrFail($id);

        $data = $request->validate([
            'slug' => ['sometimes', 'string', 'max:80', Rule::unique('practice_speaking_scenarios', 'slug')->ignore($id)],
            'title' => ['sometimes', 'string', 'max:200'],
            'level' => ['sometimes', 'string', 'in:A1,A2,B1,B2,C1'],
            'character_name' => ['sometimes', 'string', 'max:80'],
            'character_voice_label' => ['sometimes', 'string', 'max:40'],
            'description' => ['sometimes', 'string'],
            'system_prompt' => ['sometimes', 'string'],
            'opening_line' => ['sometimes', 'string'],
            'target_vocab' => ['sometimes', 'array'],
            'target_vocab.*' => ['string'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:1'],
            'expected_turns' => ['sometimes', 'integer', 'min:2'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

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
