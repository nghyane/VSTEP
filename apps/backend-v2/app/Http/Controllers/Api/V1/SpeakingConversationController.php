<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartConversationRequest;
use App\Http\Requests\Practice\SubmitTurnRequest;
use App\Models\Profile;
use App\Services\SpeakingConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SpeakingConversationController extends Controller
{
    public function __construct(
        private readonly SpeakingConversationService $service,
    ) {}

    public function listScenarios(Request $request): JsonResponse
    {
        $level = $request->string('level')->toString() ?: null;
        $scenarios = $this->service->listScenarios($level);

        return response()->json(['data' => $scenarios->map(fn ($s) => [
            'id' => $s->id, 'slug' => $s->slug, 'title' => $s->title,
            'level' => $s->level, 'character_name' => $s->character_name,
            'character_voice' => $s->character_voice_label,
            'description' => $s->description, 'estimated_minutes' => $s->estimated_minutes,
        ])->values()]);
    }

    public function showScenario(string $id): JsonResponse
    {
        $s = $this->service->getScenario($id);

        return response()->json(['data' => [
            'id' => $s->id, 'slug' => $s->slug, 'title' => $s->title,
            'level' => $s->level, 'character_name' => $s->character_name,
            'character_voice' => $s->character_voice_label,
            'description' => $s->description, 'estimated_minutes' => $s->estimated_minutes,
            'target_vocab' => $s->target_vocab, 'expected_turns' => $s->expected_turns,
        ]]);
    }

    public function start(StartConversationRequest $request): JsonResponse
    {
        $result = $this->service->startSession(
            $this->profile($request),
            $request->validated('scenario_id'),
        );

        $session = $result['session'];
        $scenario = $session->scenario;

        return response()->json(['data' => [
            'session_id' => $session->id,
            'scenario' => [
                'id' => $scenario->id, 'slug' => $scenario->slug, 'title' => $scenario->title,
                'level' => $scenario->level, 'character_name' => $scenario->character_name,
                'character_voice' => $scenario->character_voice_label,
                'description' => $scenario->description, 'estimated_minutes' => $scenario->estimated_minutes,
                'target_vocab' => $scenario->target_vocab, 'expected_turns' => $scenario->expected_turns,
            ],
            'turns' => collect($result['turns'])->map(fn ($t) => $this->formatTurn($t))->toArray(),
        ]], 201);
    }

    public function submitTurn(SubmitTurnRequest $request, string $sessionId): JsonResponse
    {
        $confidence = (float) ($request->validated('confidence') ?? 1.0);
        if ($confidence > 0 && $confidence < 0.2) {
            return response()->json([
                'error' => 'low_confidence',
                'message' => 'Không nghe rõ. Vui lòng nói lại.',
            ], 422);
        }

        $result = $this->service->submitTurn(
            $this->profile($request),
            $sessionId,
            $request->validated('text'),
        );

        $session = $result['session'];

        return response()->json(['data' => [
            'user_turn' => $this->formatTurn($result['user_turn']),
            'ai_turn' => $this->formatTurn($result['ai_turn']),
            'session' => [
                'user_turn_count' => $session->user_turn_count,
                'expected_turns' => $session->scenario->expected_turns,
                'should_end' => $session->user_turn_count >= $session->scenario->expected_turns,
            ],
        ]]);
    }

    public function end(Request $request, string $sessionId): JsonResponse
    {
        $session = $this->service->endSession($this->profile($request), $sessionId);
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

    public function show(Request $request, string $sessionId): JsonResponse
    {
        $session = $this->service->getSession($this->profile($request), $sessionId);
        $scenario = $session->scenario;

        return response()->json(['data' => [
            'session_id' => $session->id,
            'scenario' => [
                'id' => $scenario->id, 'slug' => $scenario->slug, 'title' => $scenario->title,
                'level' => $scenario->level, 'character_name' => $scenario->character_name,
                'character_voice' => $scenario->character_voice_label,
                'description' => $scenario->description, 'estimated_minutes' => $scenario->estimated_minutes,
                'target_vocab' => $scenario->target_vocab, 'expected_turns' => $scenario->expected_turns,
            ],
            'turns' => $session->turns->map(fn ($t) => $this->formatTurn($t))->toArray(),
        ]]);
    }

    public function history(Request $request): JsonResponse
    {
        $paginator = $this->service->listHistory($this->profile($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn ($s) => [
                'id' => $s->id,
                'scenario' => [
                    'id' => $s->scenario->id,
                    'title' => $s->scenario->title,
                    'level' => $s->scenario->level,
                ],
                'ended_at' => $s->ended_at,
                'duration_seconds' => $s->duration_seconds,
                'user_turn_count' => $s->user_turn_count,
                'vocab_used_pct' => $s->vocab_target_count > 0
                    ? (int) round($s->vocab_used_count / $s->vocab_target_count * 100)
                    : 0,
            ]),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function review(Request $request, string $sessionId): JsonResponse
    {
        $result = $this->service->reviewSession($this->profile($request), $sessionId);

        return response()->json(['data' => $result]);
    }

    public function pronunciationReview(Request $request): JsonResponse
    {
        $request->validate([
            'original' => ['required', 'string', 'max:500'],
            'transcript' => ['required', 'string', 'max:500'],
        ]);

        $result = $this->service->pronunciationReview(
            $request->input('original'),
            $request->input('transcript'),
        );

        return response()->json(['data' => $result]);
    }

    private function formatTurn($turn): array
    {
        $ipa = $turn->getAttribute('ipa');
        if (! $ipa && $turn->role === 'user' && is_array($turn->feedback)) {
            $ipa = $turn->feedback['user_ipa'] ?? null;
        }

        return [
            'id' => $turn->id,
            'role' => $turn->role,
            'text' => $turn->text,
            'ipa' => $ipa,
            'feedback' => $turn->feedback,
            'suggested_words' => $turn->suggested_words ?? [],
        ];
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
