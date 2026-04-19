<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExamListeningPlayLog;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamService $examService,
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

    public function submit(Request $request, string $sessionId): JsonResponse
    {
        $request->validate([
            'mcq_answers' => ['nullable', 'array'],
            'mcq_answers.*.item_ref_type' => ['required', 'string'],
            'mcq_answers.*.item_ref_id' => ['required', 'uuid'],
            'mcq_answers.*.selected_index' => ['required', 'integer', 'min:0', 'max:3'],
        ]);

        /** @var ExamSession $session */
        $session = ExamSession::query()->findOrFail($sessionId);

        $result = $this->examService->submit(
            $this->profile($request),
            $session,
            $request->input('mcq_answers', []),
        );

        return response()->json(['data' => [
            'session_id' => $result['session']->id,
            'status' => $result['session']->status,
            'mcq_score' => $result['mcq_score'],
            'mcq_total' => $result['mcq_total'],
            'submitted_at' => $result['session']->submitted_at,
        ]]);
    }

    public function mySessions(Request $request): JsonResponse
    {
        $profile = $this->profile($request);

        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->limit(10)
            ->get(['id', 'exam_version_id', 'mode', 'is_full_test', 'started_at', 'submitted_at']);

        $data = $sessions->map(function (ExamSession $session) {
            // MCQ scores (listening + reading)
            $mcqAnswers = ExamMcqAnswer::query()
                ->where('session_id', $session->id)
                ->get();
            $listeningCorrect = $mcqAnswers->where('item_ref_type', 'listening')->where('is_correct', true)->count();
            $listeningTotal = $mcqAnswers->where('item_ref_type', 'listening')->count();
            $readingCorrect = $mcqAnswers->where('item_ref_type', 'reading')->where('is_correct', true)->count();
            $readingTotal = $mcqAnswers->where('item_ref_type', 'reading')->count();

            // Writing grading band
            $writingBand = WritingGradingResult::query()
                ->where('submission_type', 'exam_writing')
                ->whereIn('submission_id', function ($q) use ($session) {
                    $q->select('id')->from('exam_writing_submissions')->where('session_id', $session->id);
                })
                ->where('is_active', true)
                ->avg('overall_band');

            // Speaking grading band
            $speakingBand = SpeakingGradingResult::query()
                ->where('submission_type', 'exam_speaking')
                ->whereIn('submission_id', function ($q) use ($session) {
                    $q->select('id')->from('exam_speaking_submissions')->where('session_id', $session->id);
                })
                ->where('is_active', true)
                ->avg('overall_band');

            return [
                'id' => $session->id,
                'mode' => $session->mode,
                'is_full_test' => $session->is_full_test,
                'submitted_at' => $session->submitted_at,
                'scores' => [
                    'listening' => $listeningTotal > 0 ? round($listeningCorrect / $listeningTotal * 10, 1) : null,
                    'reading' => $readingTotal > 0 ? round($readingCorrect / $readingTotal * 10, 1) : null,
                    'writing' => $writingBand ? round((float) $writingBand, 1) : null,
                    'speaking' => $speakingBand ? round((float) $speakingBand, 1) : null,
                ],
            ];
        });

        return response()->json(['data' => $data]);
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

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
