<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use App\Http\Controllers\Controller;
use App\Http\Resources\PracticeSessionResource;
use App\Models\PracticeSession;
use App\Services\PracticeService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Validation\Rule;

class PracticeController extends Controller
{
    public function __construct(
        private readonly PracticeService $service,
    ) {}

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
        ]], 201);
    }

    #[Authorize('view', 'practiceSession')]
    public function show(PracticeSession $practiceSession)
    {
        $practiceSession->load('submissions.question');

        return new PracticeSessionResource($practiceSession);
    }

    #[Authorize('view', 'practiceSession')]
    public function submit(Request $request, PracticeSession $practiceSession)
    {
        $request->validate([
            'answer' => ['required', 'array'],
        ]);

        $result = $this->service->submit($practiceSession, $request->validated()['answer']);

        return response()->json(['data' => $result]);
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
