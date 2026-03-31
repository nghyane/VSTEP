<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use App\Http\Controllers\Controller;
use App\Http\Resources\PracticeSessionResource;
use App\Http\Resources\QuestionResource;
use App\Models\PracticeSession;
use App\Services\PracticeService;
use App\Services\QuestionService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Validation\ClosureValidationRule;
use Illuminate\Validation\Rule;

class PracticeController extends Controller
{
    private const INVALID_AUDIO_PATH_PREFIXES = ['blob:', 'data:'];

    public function __construct(
        private readonly PracticeService $service,
        private readonly QuestionService $questionService,
    ) {}

    /**
     * List active questions for learners (answer_key & explanation hidden).
     * GET /practice/questions?skill=writing&level=B1&part=1&topic=...
     */
    public function questions(Request $request)
    {
        $filters = $request->only(['skill', 'level', 'part', 'topic', 'search']);
        $filters['is_active'] = true;

        $questions = $this->questionService->list($filters);

        $questions->getCollection()->each->makeHidden(['answer_key', 'explanation']);

        return QuestionResource::collection($questions);
    }

    public function start(Request $request)
    {
        $validated = $request->validate([
            'skill' => ['required', 'string', Rule::enum(Skill::class)],
            'mode' => ['required', 'string', Rule::enum(PracticeMode::class)],
            'level' => ['nullable', 'string', Rule::enum(Level::class)],
            'items_count' => ['nullable', 'integer', 'min:1', 'max:20'],
            'focus_kp' => ['nullable', 'string'],
        ]);

        $result = $this->service->start(
            $request->user()->id,
            Skill::from($validated['skill']),
            PracticeMode::from($validated['mode']),
            $validated,
        );

        return response()->json(['data' => [
            'session' => new PracticeSessionResource($result['session']),
            'current_item' => $result['current_item'],
            'recommendation' => $result['recommendation'],
            'progress' => $result['progress'],
            'writing_tier' => $result['writing_tier'],
        ]], 201);
    }

    #[Authorize('view', 'practiceSession')]
    public function show(PracticeSession $practiceSession)
    {
        $result = $this->service->show($practiceSession);

        $session = $result['session'];

        return response()->json(['data' => [
            'session' => new PracticeSessionResource($session),
            'current_item' => $result['current_item'] ?? null,
            'progress' => $result['progress'] ?? null,
            'writing_tier' => $session->config['writing_tier'] ?? null,
        ]]);
    }

    #[Authorize('view', 'practiceSession')]
    public function submit(Request $request, PracticeSession $practiceSession)
    {
        $rules = ['answer' => ['required', 'array']];

        $mode = $practiceSession->mode;
        $skill = $practiceSession->skill;

        if ($mode === PracticeMode::Shadowing || $mode === PracticeMode::Drill) {
            $rules['answer.audio_path'] = $this->speakingAudioPathRules();
        } elseif ($mode === PracticeMode::Guided) {
            $rules['answer.text'] = ['required', 'string'];
        } elseif ($mode === PracticeMode::Free) {
            if ($skill->isObjective()) {
                $rules['answer.answers'] = ['required', 'array'];
            } else {
                if ($skill === Skill::Speaking) {
                    $rules['answer.audio_path'] = $this->speakingAudioPathRules();
                } else {
                    $rules['answer.text'] = ['required_without:answer.audio_path', 'nullable', 'string'];
                    $rules['answer.audio_path'] = ['required_without:answer.text', 'nullable', 'string'];
                }
            }
        }

        $validated = $request->validate($rules);

        $result = $this->service->submit($practiceSession, $validated['answer']);

        return response()->json(['data' => $result]);
    }

    /**
     * @return list<string|ClosureValidationRule>
     */
    private function speakingAudioPathRules(): array
    {
        return [
            'required',
            'string',
            'starts_with:speaking/',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if (! is_string($value)) {
                    return;
                }

                foreach (self::INVALID_AUDIO_PATH_PREFIXES as $prefix) {
                    if (str_starts_with($value, $prefix)) {
                        $fail('The '.$attribute.' must be an uploaded storage path, not a temporary browser URL.');

                        return;
                    }
                }
            },
        ];
    }

    #[Authorize('view', 'practiceSession')]
    public function complete(PracticeSession $practiceSession)
    {
        $session = $this->service->complete($practiceSession);

        return new PracticeSessionResource($session);
    }

    public function index(Request $request)
    {
        $skill = $request->query('skill')
            ? Skill::from($request->query('skill'))
            : null;

        return PracticeSessionResource::collection(
            $this->service->list($request->user()->id, $skill),
        );
    }
}
