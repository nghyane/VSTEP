<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListExamsRequest;
use App\Http\Requests\LogListeningPlayedRequest;
use App\Http\Requests\RestartExamSessionRequest;
use App\Http\Requests\SaveExamDraftRequest;
use App\Http\Requests\StartExamSessionRequest;
use App\Http\Requests\SubmitExamRequest;
use App\Http\Resources\ExamResource;
use App\Http\Resources\ExamSessionResultResource;
use App\Http\Resources\ExamSubmitResultResource;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Services\Contracts\ExamCatalogInterface;
use App\Services\Contracts\ExamOverviewInterface;
use App\Services\Contracts\ExamRoomInterface;
use App\Services\Contracts\ExamSessionResultInterface;
use App\Services\ExamSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class ExamController extends Controller
{
    public function __construct(
        private readonly ExamCatalogInterface $examCatalog,
        private readonly ExamOverviewInterface $examOverview,
        private readonly ExamSessionService $examService,
        private readonly ExamSessionResultInterface $sessionResults,
        private readonly ExamRoomInterface $examRoom,
    ) {}

    public function index(ListExamsRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $filters = array_intersect_key($validated, array_flip(['q', 'status', 'sort']));
        $perPage = (int) ($validated['per_page'] ?? 12);

        return ExamResource::collection($this->examCatalog->listForProfile($request->profile(), $filters, $perPage));
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $data = $this->examOverview->show($request->profile(), $id);

        return response()->json(['data' => $data]);
    }

    public function startSession(StartExamSessionRequest $request, string $examId): JsonResponse
    {
        $validated = $request->validated();
        $data = $this->examService->getExamWithActiveVersion($examId);
        /** @var ExamVersion $version */
        $version = $data['version'];

        $session = $this->examService->startSession(
            $request->profile(),
            $version,
            $validated['mode'],
            $validated['selected_skills'] ?? [],
            (float) ($validated['time_extension_factor'] ?? 1.0),
        );

        return response()->json(['data' => [
            'session_id' => $session->id,
            'server_deadline_at' => $session->server_deadline_at,
            'coins_charged' => $session->coins_charged,
            'status' => $session->status,
        ]], 201);
    }

    public function restartSession(RestartExamSessionRequest $request, string $examId): JsonResponse
    {
        $validated = $request->validated();
        $data = $this->examService->getExamWithActiveVersion($examId);
        /** @var ExamVersion $version */
        $version = $data['version'];

        $session = $this->examService->restartSession(
            $request->profile(),
            $version,
            $validated['abandon_session_id'],
            $validated['mode'],
            $validated['selected_skills'] ?? [],
            (float) ($validated['time_extension_factor'] ?? 1.0),
        );

        return response()->json(['data' => [
            'session_id' => $session->id,
            'server_deadline_at' => $session->server_deadline_at,
            'coins_charged' => $session->coins_charged,
            'status' => $session->status,
        ]], 201);
    }

    public function submit(SubmitExamRequest $request, ExamSession $examSession): JsonResponse
    {
        $result = $this->examService->submit(
            $request->profile(),
            $examSession,
            $request->validated('mcq_answers') ?? [],
            $request->validated('writing_answers') ?? [],
            $request->validated('speaking_answers') ?? [],
        );

        return response()->json([
            'data' => ExamSubmitResultResource::make($result)->toArray($request),
        ]);
    }

    public function saveDraft(SaveExamDraftRequest $request, ExamSession $examSession): JsonResponse
    {
        $draft = $this->examService->saveDraft($request->profile(), $examSession, [
            'skill_idx' => (int) $request->validated('skill_idx'),
            'mcq_answers' => $request->validated('mcq_answers'),
            'writing_answers' => $request->validated('writing_answers'),
            'speaking_marks' => $request->validated('speaking_marks'),
        ]);

        return response()->json(['data' => [
            'session_id' => $draft->session_id, 'skill_idx' => $draft->skill_idx,
            'mcq_answers' => $draft->mcq_answers, 'writing_answers' => $draft->writing_answers,
            'speaking_marks' => $draft->speaking_marks, 'saved_at' => $draft->saved_at,
        ]]);
    }

    public function showRoom(Request $request, ExamSession $examSession): JsonResponse
    {
        return response()->json(['data' => $this->examRoom->open($request->profile(), $examSession)]);
    }

    public function logListeningPlayed(LogListeningPlayedRequest $request, ExamSession $examSession): JsonResponse
    {
        $validated = $request->validated();

        return response()->json([
            'data' => $this->examRoom->markListeningPlayed(
                $request->profile(),
                $examSession,
                $validated['section_id'],
                $request->ip(),
            ),
        ]);
    }

    public function sessionResults(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);

        return response()->json([
            'data' => ExamSessionResultResource::make($this->sessionResults->get($examSession))->toArray($request),
        ]);
    }
}
