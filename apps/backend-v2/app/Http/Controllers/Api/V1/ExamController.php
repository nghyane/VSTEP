<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\ExamSessionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ListExamsRequest;
use App\Http\Requests\LogListeningPlayedRequest;
use App\Http\Requests\SaveExamDraftRequest;
use App\Http\Requests\StartExamSessionRequest;
use App\Http\Requests\SubmitExamRequest;
use App\Http\Resources\ExamResource;
use App\Http\Resources\ExamSessionListResource;
use App\Http\Resources\ExamSpeakingResultResource;
use App\Http\Resources\ExamSubmitResultResource;
use App\Http\Resources\ExamWritingResultResource;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamSession;
use App\Models\ExamSessionDraft;
use App\Models\ExamVersion;
use App\Services\Contracts\ExamCatalogInterface;
use App\Services\Contracts\ExamSessionResultInterface;
use App\Services\ExamScoringService;
use App\Services\ExamSessionService;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

final class ExamController extends Controller
{
    public function __construct(
        private readonly ExamCatalogInterface $examCatalog,
        private readonly ExamSessionService $examService,
        private readonly ExamScoringService $scoringService,
        private readonly ProgressService $progressService,
        private readonly ExamSessionResultInterface $sessionResults,
    ) {}

    public function index(ListExamsRequest $request): AnonymousResourceCollection
    {
        $validated = $request->validated();
        $filters = array_intersect_key($validated, array_flip(['q', 'status', 'sort']));
        $perPage = (int) ($validated['per_page'] ?? 12);

        return ExamResource::collection($this->examCatalog->listForProfile($request->profile(), $filters, $perPage));
    }

    public function show(string $id): JsonResponse
    {
        $data = $this->examService->getExamWithActiveVersion($id);

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

    public function writingResults(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);
        $examSession->load('writingSubmissions.assessmentAttempt.result', 'writingSubmissions.assessmentAttempt.job');

        return response()->json(['data' => ExamWritingResultResource::collection($examSession->writingSubmissions)]);
    }

    public function speakingResults(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);
        $examSession->load('speakingSubmissions.assessmentAttempt.result', 'speakingSubmissions.assessmentAttempt.job');

        return response()->json(['data' => ExamSpeakingResultResource::collection($examSession->speakingSubmissions)]);
    }

    public function mySessions(Request $request): JsonResponse
    {
        $profile = $request->profile();
        $status = $request->input('status');

        $query = ExamSession::query()
            ->with('examVersion:id,exam_id')
            ->where('profile_id', $profile->id)
            ->orderByDesc('started_at')
            ->limit(50);

        if ($status !== null && $status !== 'all') {
            $query->where('status', $status);
        }

        $sessions = $query->get()->map(
            fn (ExamSession $session) => (new ExamSessionListResource($session, $this->scoringService))->toArray($request)
        );

        return response()->json(['data' => $sessions]);
    }

    public function abandon(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('update', $examSession);
        if ($examSession->status !== ExamSessionStatus::Active) {
            return response()->json(['data' => ['abandoned' => false]]);
        }
        DB::transaction(function () use ($examSession) {
            $examSession->update(['status' => ExamSessionStatus::AutoSubmitted, 'submitted_at' => now()]);
            ExamSessionDraft::query()->where('session_id', $examSession->id)->delete();
        });
        DB::afterCommit(fn () => $this->progressService->recordExamCompletion($examSession->fresh()));

        return response()->json(['data' => ['abandoned' => true]]);
    }

    public function getDraft(Request $request, ExamSession $examSession): JsonResponse
    {
        $draft = $this->examService->getDraft($request->profile(), $examSession);
        if ($draft === null) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => [
            'session_id' => $draft->session_id, 'skill_idx' => $draft->skill_idx,
            'mcq_answers' => $draft->mcq_answers, 'writing_answers' => $draft->writing_answers,
            'speaking_marks' => $draft->speaking_marks, 'saved_at' => $draft->saved_at,
        ]]);
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

    public function activeSession(Request $request): JsonResponse
    {
        $profile = $request->profile();

        $session = ExamSession::query()
            ->with('examVersion:id,exam_id', 'examVersion.exam:id,title')
            ->where('profile_id', $profile->id)
            ->where('status', ExamSessionStatus::Active)
            ->where('server_deadline_at', '>', now())
            ->latest('started_at')
            ->first();

        if ($session === null) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => [
            'id' => $session->id,
            'exam_id' => $session->examVersion->exam_id,
            'exam_title' => $session->examVersion->exam?->title,
            'exam_version_id' => $session->exam_version_id,
            'mode' => $session->mode,
            'selected_skills' => $session->selected_skills,
            'is_full_test' => $session->is_full_test,
            'started_at' => $session->started_at,
            'server_deadline_at' => $session->server_deadline_at,
            'status' => $session->status,
            'coins_charged' => $session->coins_charged,
        ]]);
    }

    public function showSession(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);

        return response()->json(['data' => $examSession]);
    }

    public function logListeningPlayed(LogListeningPlayedRequest $request, ExamSession $examSession): JsonResponse
    {
        $validated = $request->validated();
        Gate::authorize('update', $examSession);
        if ($examSession->status !== ExamSessionStatus::Active) {
            return response()->json(['data' => ['error' => 'Session is not active.']], 409);
        }
        $log = ExamListeningPlayLog::firstOrCreate(
            ['session_id' => $examSession->id, 'section_id' => $validated['section_id']],
            ['played_at' => now(), 'client_ip' => $request->ip()],
        );

        return $log->wasRecentlyCreated
            ? response()->json(['data' => ['played_at' => $log->played_at]])
            : response()->json(['data' => ['already_played' => true]], 409);
    }

    public function sessionResults(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);

        return response()->json(['data' => $this->sessionResults->get($examSession)]);
    }

    public function listeningPlaySummary(Request $request, ExamSession $examSession): JsonResponse
    {
        Gate::authorize('view', $examSession);
        $examSession->loadMissing(['examVersion.listeningSections']);

        $playedSectionIds = ExamListeningPlayLog::query()
            ->where('session_id', $examSession->id)
            ->pluck('section_id')->toArray();

        $summary = $examSession->examVersion->listeningSections->map(fn ($section) => [
            'section_id' => $section->id,
            'part' => $section->part,
            'played' => in_array($section->id, $playedSectionIds, true),
        ]);

        return response()->json(['data' => $summary]);
    }
}
