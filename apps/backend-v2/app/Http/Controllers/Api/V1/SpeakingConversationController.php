<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\PronunciationReviewRequest;
use App\Http\Requests\Practice\StartConversationRequest;
use App\Http\Requests\Practice\SubmitTurnRequest;
use App\Http\Resources\ConversationHistoryResource;
use App\Http\Resources\ConversationTurnResource;
use App\Http\Resources\ScenarioDetailResource;
use App\Http\Resources\ScenarioSummaryResource;
use App\Models\PracticeSpeakingConversationSession;
use App\Services\SpeakingConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class SpeakingConversationController extends Controller
{
    public function __construct(
        private readonly SpeakingConversationService $service,
    ) {}

    public function listScenarios(Request $request): JsonResponse
    {
        $level = $request->string('level')->toString() ?: null;
        $scenarios = $this->service->listScenarios($level);

        return response()->json(['data' => ScenarioSummaryResource::collection($scenarios)]);
    }

    public function showScenario(string $id): JsonResponse
    {
        $s = $this->service->getScenario($id);

        return response()->json(['data' => ScenarioDetailResource::make($s)]);
    }

    public function start(StartConversationRequest $request): JsonResponse
    {
        $result = $this->service->startSession(
            $request->profile(),
            $request->validated('scenario_id'),
        );

        $session = $result['session'];
        $scenario = $session->scenario;

        return response()->json(['data' => [
            'session_id' => $session->id,
            'scenario' => ScenarioDetailResource::make($scenario),
            'turns' => ConversationTurnResource::collection(collect($result['turns'])),
            'resumed' => $result['resumed'] ?? false,
        ]], 201);
    }

    public function submitTurn(SubmitTurnRequest $request, PracticeSpeakingConversationSession $conversationSession): JsonResponse
    {
        Gate::authorize('update', $conversationSession);

        $confidence = (float) ($request->validated('confidence') ?? 1.0);
        if ($confidence > 0 && $confidence < 0.2) {
            return response()->json(['error' => 'low_confidence', 'message' => 'Không nghe rõ. Vui lòng nói lại.'], 422);
        }
        $result = $this->service->submitTurn($conversationSession, $request->validated('text'));
        $session = $result['session'];

        return response()->json(['data' => [
            'user_turn' => ConversationTurnResource::make($result['user_turn']),
            'ai_turn' => ConversationTurnResource::make($result['ai_turn']),
            'session' => [
                'user_turn_count' => $session->user_turn_count,
                'expected_turns' => $session->scenario->expected_turns,
                'should_end' => $session->user_turn_count >= $session->scenario->expected_turns,
            ],
        ]]);
    }

    public function end(Request $request, PracticeSpeakingConversationSession $conversationSession): JsonResponse
    {
        Gate::authorize('update', $conversationSession);
        $session = $this->service->endSession($conversationSession);
        $vocabPct = $session->vocab_target_count > 0
            ? (int) round($session->vocab_used_count / $session->vocab_target_count * 100)
            : 0;
        $grammarPct = $session->user_turn_count > 0
            ? (int) round($session->grammar_ok_count / $session->user_turn_count * 100)
            : 0;

        return response()->json(['data' => [
            'session_id' => $session->id,
            'duration_seconds' => $session->duration_seconds,
            'user_turn_count' => $session->user_turn_count,
            'vocab_used_count' => $session->vocab_used_count,
            'vocab_target_count' => $session->vocab_target_count,
            'grammar_ok_count' => $session->grammar_ok_count,
            'vocab_used_pct' => $vocabPct,
            'grammar_ok_pct' => $grammarPct,
        ]]);
    }

    public function show(Request $request, PracticeSpeakingConversationSession $conversationSession): JsonResponse
    {
        Gate::authorize('view', $conversationSession);
        $session = $this->service->getSession($conversationSession);
        $scenario = $session->scenario;

        return response()->json(['data' => [
            'session_id' => $session->id,
            'scenario' => ScenarioDetailResource::make($scenario),
            'turns' => ConversationTurnResource::collection($session->turns),
        ]]);
    }

    public function history(Request $request): JsonResponse
    {
        $paginator = $this->service->listHistory($request->profile());

        return ConversationHistoryResource::collection($paginator->items())
            ->additional(['meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ]])->response();
    }

    public function review(Request $request, PracticeSpeakingConversationSession $conversationSession): JsonResponse
    {
        Gate::authorize('view', $conversationSession);

        return response()->json(['data' => $this->service->reviewSession($conversationSession)]);
    }

    public function pronunciationReview(PronunciationReviewRequest $request): JsonResponse
    {
        $result = $this->service->pronunciationReview(
            $request->validated('original'),
            $request->validated('transcript'),
        );

        return response()->json(['data' => $result]);
    }
}
