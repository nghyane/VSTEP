<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminExerciseFeedbackResource;
use App\Services\ExerciseFeedbackService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Validation\Rule;

final class FeedbackController extends Controller
{
    public function __construct(
        private readonly ExerciseFeedbackService $service,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $validated = $request->validate([
            'content_type' => [
                'nullable',
                'string',
                Rule::in(['practice_listening_exercise', 'practice_reading_exercise']),
            ],
            'content_id' => ['nullable', 'uuid'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);

        return AdminExerciseFeedbackResource::collection($this->service->listForAdmin($validated, $perPage));
    }
}
