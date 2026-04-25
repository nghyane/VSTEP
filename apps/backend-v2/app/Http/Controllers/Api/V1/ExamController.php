<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitExamRequest;
use App\Http\Resources\ExamSpeakingResultResource;
use App\Http\Resources\ExamSubmitResultResource;
use App\Http\Resources\ExamWritingResultResource;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Services\ExamScoringService;
use App\Services\ExamSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamSessionService $examService,
        private readonly ExamScoringService $scoringService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->examService->listPublished()]);
    }

    public function show(string $id): JsonResponse
    {
        $data = $this->examService->getExamWithActiveVersion($id);

        return response()->json(['data' => $data]);
    }

    public function startSession(Request $request, string $examId): JsonResponse
    {
        $request->validate([
            'mode' => ['required', 'in:custom,full'],
            'selected_skills' => ['required_if:mode,custom', 'array'],
            'selected_skills.*' => ['string', 'in:listening,reading,writing,speaking'],
            'time_extension_factor' => ['nullable', 'numeric', 'min:1', 'max:3'],
        ]);

        $data = $this->examService->getExamWithActiveVersion($examId);
        /** @var ExamVersion $version */
        $version = $data['version'];

        $session = $this->examService->startSession(
            $this->profile($request),
            $version,
            $request->input('mode'),
            $request->input('selected_skills', []),
            (float) $request->input('time_extension_factor', 1.0),
        );

        return response()->json(['data' => [
            'session_id' => $session->id,
            'server_deadline_at' => $session->server_deadline_at,
            'coins_charged' => $session->coins_charged,
            'status' => $session->status,
        ]], 201);
    }

    public function submit(SubmitExamRequest $request, string $sessionId): JsonResponse
    {
        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);

        $result = $this->examService->submit(
            $this->profile($request),
            $session,
            $request->validated('mcq_answers') ?? [],
            $request->validated('writing_answers') ?? [],
            $request->validated('speaking_answers') ?? [],
        );

        return response()->json([
            'data' => ExamSubmitResultResource::make($result)->toArray($request),
        ]);
    }

    public function writingResults(Request $request, string $sessionId): JsonResponse
    {
        $session = ExamSession::query()
            ->with(['writingSubmissions'])
            ->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        $data = ExamWritingResultResource::collection($session->writingSubmissions);

        return response()->json(['data' => $data]);
    }

    public function speakingResults(Request $request, string $sessionId): JsonResponse
    {
        $session = ExamSession::query()
            ->with(['speakingSubmissions'])
            ->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        $data = ExamSpeakingResultResource::collection($session->speakingSubmissions);

        return response()->json(['data' => $data]);
    }

    public function mySessions(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        $status = $request->input('status');

        $query = ExamSession::query()
            ->with('examVersion:id,exam_id')
            ->where('profile_id', $profile->id)
            ->orderByDesc('started_at')
            ->limit(50);

        if ($status !== null && $status !== 'all') {
            $query->where('status', $status);
        }

        $sessions = $query->get()->map(fn (ExamSession $session) => [
            'id' => $session->id,
            'exam_id' => $session->examVersion?->exam_id,
            'exam_version_id' => $session->exam_version_id,
            'mode' => $session->mode,
            'is_full_test' => $session->is_full_test,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'submitted_at' => $session->submitted_at,
            'scores' => in_array($session->status, ['submitted', 'graded'], true)
                ? $this->scoringService->getSessionScores($session)
                : null,
        ]);

        return response()->json(['data' => $sessions]);
    }

    public function abandon(Request $request, string $sessionId): JsonResponse
    {
        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }
        if ($session->status !== 'active') {
            return response()->json(['data' => ['abandoned' => false]]);
        }
        $session->update([
            'status' => 'auto_submitted',
            'submitted_at' => now(),
        ]);

        return response()->json(['data' => ['abandoned' => true]]);
    }

    public function activeSession(Request $request): JsonResponse
    {
        $profile = $this->profile($request);

        $session = ExamSession::query()
            ->with('examVersion:id,exam_id', 'examVersion.exam:id,title')
            ->where('profile_id', $profile->id)
            ->where('status', 'active')
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

    public function showSession(Request $request, string $sessionId): JsonResponse
    {
        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        return response()->json(['data' => $session]);
    }

    public function logListeningPlayed(Request $request, string $sessionId): JsonResponse
    {
        $request->validate(['section_id' => ['required', 'uuid']]);
        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        $exists = ExamListeningPlayLog::query()
            ->where('session_id', $session->id)
            ->where('section_id', $request->input('section_id'))
            ->exists();

        if ($exists) {
            return response()->json(['data' => ['already_played' => true]], 409);
        }

        ExamListeningPlayLog::create([
            'session_id' => $session->id,
            'section_id' => $request->input('section_id'),
            'played_at' => now(),
            'client_ip' => $request->ip(),
        ]);

        return response()->json(['data' => ['played_at' => now()]]);
    }

    public function sessionResults(Request $request, string $sessionId): JsonResponse
    {
        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        if (! in_array($session->status, ['submitted', 'graded'], true)) {
            return response()->json(['data' => [
                'session' => $this->formatSessionSummary($session),
                'scores' => null,
                'message' => 'Session not yet submitted or graded.',
            ]]);
        }

        // Eager load all result data in one query set
        $session->load([
            'mcqAnswers',
            'writingSubmissions.gradingResults',
            'speakingSubmissions.gradingResults',
            'examVersion.listeningSections.items',
            'examVersion.readingPassages.items',
        ]);

        $mcqBand = $this->scoringService->getSessionScores($session);

        // MCQ detail: per-item breakdown (chỉ các câu đã đáp)
        $mcqDetail = $this->buildMcqDetail($session);

        // MCQ summary: score + total. Total = số item trong selected_skills của version
        // (câu không đáp tính sai → cùng logic với submit() để FE đọc trực tiếp).
        $mcqSummary = $this->buildMcqSummary($session);

        // Writing feedback
        $writingFeedback = $session->writingSubmissions->map(function ($submission) {
            $result = $submission->gradingResults->where('is_active', true)->first();

            return [
                'submission_id' => $submission->id,
                'task_id' => $submission->task_id,
                'word_count' => $submission->word_count,
                'text' => $submission->text,
                'overall_band' => $result?->overall_band,
                'rubric_scores' => $result?->rubric_scores,
                'strengths' => $result?->strengths,
                'improvements' => $result?->improvements,
                'rewrites' => $result?->rewrites,
                'paragraph_feedback' => $result?->paragraph_feedback,
            ];
        });

        // Speaking feedback
        $speakingFeedback = $session->speakingSubmissions->map(function ($submission) {
            $result = $submission->gradingResults->where('is_active', true)->first();

            return [
                'submission_id' => $submission->id,
                'part_id' => $submission->part_id,
                'audio_url' => $submission->audio_url,
                'transcript' => $submission->transcript,
                'overall_band' => $result?->overall_band,
                'rubric_scores' => $result?->rubric_scores,
                'strengths' => $result?->strengths,
                'improvements' => $result?->improvements,
                'pronunciation_report' => $result?->pronunciation_report,
            ];
        });

        // Listening play log summary
        $listeningSections = $session->examVersion->listeningSections;
        $playedSectionIds = $session->listeningPlayLogs->pluck('section_id')->toArray();
        $listeningPlaySummary = $listeningSections->map(function ($section) use ($playedSectionIds) {
            return [
                'section_id' => $section->id,
                'part' => $section->part,
                'played' => in_array($section->id, $playedSectionIds, true),
            ];
        });

        return response()->json(['data' => [
            'session' => $this->formatSessionSummary($session),
            'scores' => $mcqBand,
            'mcq' => $mcqSummary,
            'mcq_detail' => $mcqDetail,
            'writing_feedback' => $writingFeedback,
            'speaking_feedback' => $speakingFeedback,
            'listening_play_summary' => $listeningPlaySummary,
        ]]);
    }

    public function listeningPlaySummary(Request $request, string $sessionId): JsonResponse
    {
        /** @var ExamSession $session */
        $session = ExamSession::query()->with(['examVersion.listeningSections'])->findOrFail($sessionId);
        if ($session->profile_id !== $this->profile($request)->id) {
            abort(403);
        }

        $playedSectionIds = ExamListeningPlayLog::query()
            ->where('session_id', $session->id)
            ->pluck('section_id')
            ->toArray();

        $summary = $session->examVersion->listeningSections->map(function ($section) use ($playedSectionIds) {
            return [
                'section_id' => $section->id,
                'part' => $section->part,
                'played' => in_array($section->id, $playedSectionIds, true),
            ];
        });

        return response()->json(['data' => $summary]);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }

    /** @return array<string, mixed> */
    private function formatSessionSummary(ExamSession $session): array
    {
        return [
            'id' => $session->id,
            'exam_version_id' => $session->exam_version_id,
            'mode' => $session->mode,
            'is_full_test' => $session->is_full_test,
            'selected_skills' => $session->selected_skills,
            'status' => $session->status,
            'started_at' => $session->started_at,
            'submitted_at' => $session->submitted_at,
            'server_deadline_at' => $session->server_deadline_at,
            'coins_charged' => $session->coins_charged,
        ];
    }

    /**
     * Aggregate MCQ score/total cho session đã submit. Total = số item thuộc selected_skills
     * trong version (câu không trả lời tính sai). Cùng logic với ExamSessionService::submit().
     *
     * @return array{score: int, total: int}
     */
    private function buildMcqSummary(ExamSession $session): array
    {
        $itemMap = $this->scoringService->loadMcqItemMap($session);
        $skills = $session->selected_skills ?? [];

        $total = 0;
        foreach (array_keys($itemMap) as $key) {
            if (str_starts_with($key, 'exam_listening_item:') && in_array('listening', $skills, true)) {
                $total++;
            } elseif (str_starts_with($key, 'exam_reading_item:') && in_array('reading', $skills, true)) {
                $total++;
            }
        }

        $score = $session->mcqAnswers->where('is_correct', true)->count();

        return ['score' => $score, 'total' => $total];
    }

    /**
     * Per-item breakdown, sắp theo canonical order của version
     * (Listening trước Reading; trong mỗi skill: theo part → section.display_order → item.display_order).
     * BE là nguồn truth duy nhất về thứ tự — FE không cần sort lại.
     *
     * @return list<array{item_ref_type: string, item_ref_id: string, selected_index: int, correct_index: int|null, is_correct: bool, answered_at: mixed}>
     */
    private function buildMcqDetail(ExamSession $session): array
    {
        $itemMap = $this->scoringService->loadMcqItemMap($session);
        $rankMap = $this->buildItemRankMap($session);

        $rows = $session->mcqAnswers->map(function (ExamMcqAnswer $answer) use ($itemMap) {
            $key = "{$answer->item_ref_type}:{$answer->item_ref_id}";

            return [
                'item_ref_type' => $answer->item_ref_type,
                'item_ref_id' => $answer->item_ref_id,
                'selected_index' => $answer->selected_index,
                'correct_index' => $itemMap[$key] ?? null,
                'is_correct' => $answer->is_correct,
                'answered_at' => $answer->answered_at,
            ];
        })->all();

        usort($rows, function (array $a, array $b) use ($rankMap) {
            $ra = $rankMap["{$a['item_ref_type']}:{$a['item_ref_id']}"] ?? PHP_INT_MAX;
            $rb = $rankMap["{$b['item_ref_type']}:{$b['item_ref_id']}"] ?? PHP_INT_MAX;

            return $ra <=> $rb;
        });

        return array_values($rows);
    }

    /**
     * Map "type:id" → ordinal theo thứ tự render của đề.
     * Listening sections đã sort theo (part, display_order, id), items theo (display_order, id) — chỉ cần đi tuần tự.
     *
     * @return array<string,int>
     */
    private function buildItemRankMap(ExamSession $session): array
    {
        $version = $session->examVersion;
        $rank = [];
        $i = 0;
        foreach ($version->listeningSections as $section) {
            foreach ($section->items as $item) {
                $rank["exam_listening_item:{$item->id}"] = $i++;
            }
        }
        foreach ($version->readingPassages as $passage) {
            foreach ($passage->items as $item) {
                $rank["exam_reading_item:{$item->id}"] = $i++;
            }
        }

        return $rank;
    }
}
