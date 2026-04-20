<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\UseSupportLevelRequest;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Services\PracticeSessionService;
use App\Services\WritingPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WritingPracticeController extends Controller
{
    public function __construct(
        private readonly WritingPracticeService $writingService,
        private readonly PracticeSessionService $sessionService,
    ) {}

    public function listPrompts(Request $request): JsonResponse
    {
        $part = $request->integer('part') ?: null;

        return response()->json(['data' => $this->writingService->listPrompts($part)->map(fn ($p) => [
            'id' => $p->id, 'slug' => $p->slug, 'title' => $p->title,
            'part' => $p->part, 'min_words' => $p->min_words, 'max_words' => $p->max_words,
            'estimated_minutes' => $p->estimated_minutes,
        ])->values()]);
    }

    public function showPrompt(string $id): JsonResponse
    {
        $prompt = $this->writingService->getPromptWithChildren($id);

        return response()->json(['data' => [
            'id' => $prompt->id, 'slug' => $prompt->slug, 'title' => $prompt->title,
            'description' => $prompt->description, 'part' => $prompt->part,
            'prompt' => $prompt->prompt, 'min_words' => $prompt->min_words,
            'max_words' => $prompt->max_words, 'required_points' => $prompt->required_points ?? [],
            'keywords' => $prompt->keywords ?? [], 'sentence_starters' => $prompt->sentence_starters ?? [],
            'sample_answer' => $prompt->sample_answer, 'estimated_minutes' => $prompt->estimated_minutes,
            'outline_sections' => $prompt->outlineSections->sortBy('display_order')->values(),
            'template_sections' => $prompt->templateSections->sortBy('display_order')->values(),
            'sample_markers' => $prompt->sampleMarkers->sortBy('display_order')->values(),
        ]]);
    }

    public function startSession(StartSessionRequest $request): JsonResponse
    {
        $session = $this->writingService->startSession(
            $this->profile($request),
            $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function useSupport(UseSupportLevelRequest $request, string $sessionId): JsonResponse
    {
        /** @var PracticeSession $session */
        $session = PracticeSession::query()->findOrFail($sessionId);

        return response()->json(['data' => $this->sessionService->useSupportLevel(
            $session, $this->profile($request), (int) $request->validated('level'),
        )]);
    }

    public function submit(Request $request, string $sessionId): JsonResponse
    {
        $request->validate(['text' => ['required', 'string', 'min:1']]);
        /** @var PracticeSession $session */
        $session = PracticeSession::query()->findOrFail($sessionId);

        $submission = $this->writingService->submit(
            $this->profile($request), $session, $request->input('text'),
        );

        return response()->json(['data' => [
            'submission_id' => $submission->id,
            'word_count' => $submission->word_count,
            'submitted_at' => $submission->submitted_at,
            'grading_status' => 'pending',
        ]]);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
