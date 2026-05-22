<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Models\PracticeShadowingProgress;
use App\Models\Profile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class ShadowingProgressController extends Controller
{
    /**
     * GET /practice/speaking/shadowing/progress
     * Returns: { data: { "lesson-id": [0, 2, 5], ... } }
     */
    public function index(Request $request): JsonResponse
    {
        $profile = $this->profile($request);

        $rows = PracticeShadowingProgress::query()
            ->where('profile_id', $profile->id)
            ->get(['lesson_id', 'segment_index', 'accuracy_percent']);

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->lesson_id][] = [
                'segment_index' => $row->segment_index,
                'accuracy_percent' => $row->accuracy_percent,
            ];
        }

        return response()->json(['data' => $grouped]);
    }

    /**
     * POST /practice/speaking/shadowing/progress
     * Body: { lesson_id, segment_index, accuracy_percent }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lesson_id' => 'required|string|max:64',
            'segment_index' => 'required|integer|min:0',
            'accuracy_percent' => 'required|integer|min:0|max:100',
        ]);

        $profile = $this->profile($request);

        $progress = PracticeShadowingProgress::query()->updateOrCreate(
            [
                'profile_id' => $profile->id,
                'lesson_id' => $validated['lesson_id'],
                'segment_index' => $validated['segment_index'],
            ],
            [
                'accuracy_percent' => $validated['accuracy_percent'],
            ],
        );

        return response()->json(['data' => [
            'lesson_id' => $progress->lesson_id,
            'segment_index' => $progress->segment_index,
            'accuracy_percent' => $progress->accuracy_percent,
        ]], 201);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
