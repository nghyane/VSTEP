<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Contracts\LearningPathInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LearningPathController extends Controller
{
    public function __construct(
        private readonly LearningPathInterface $learningPath,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->learningPath->forProfile($request->profile()),
        ]);
    }
}
