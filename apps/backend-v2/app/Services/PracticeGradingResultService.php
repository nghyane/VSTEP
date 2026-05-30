<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use App\Services\Grading\RubricResolver;

final class PracticeGradingResultService
{
    public function __construct(
        private readonly RubricResolver $rubricResolver,
    ) {}

    /** @return array{data: WritingGradingResult|null, rubric: array<string,mixed>} */
    public function writing(Profile $profile, PracticeWritingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return [
            'data' => WritingGradingResult::query()
                ->where('submission_type', 'practice_writing')
                ->where('submission_id', $submission->id)
                ->where('is_active', true)
                ->first(),
            'rubric' => $this->rubricMeta('writing'),
        ];
    }

    /** @return array{data: SpeakingGradingResult|null, rubric: array<string,mixed>} */
    public function speaking(Profile $profile, PracticeSpeakingSubmission $submission): array
    {
        if ($submission->profile_id !== $profile->id) {
            abort(403);
        }

        return [
            'data' => SpeakingGradingResult::query()
                ->where('submission_type', 'practice_speaking')
                ->where('submission_id', $submission->id)
                ->where('is_active', true)
                ->first(),
            'rubric' => $this->rubricMeta('speaking'),
        ];
    }

    /** @return array{max_score: int, criteria: list<array{key: string, label: string, max: int}>} */
    private function rubricMeta(string $skill): array
    {
        $rubric = $this->rubricResolver->active($skill);

        return [
            'max_score' => (int) ($rubric->criteria[0]['max_score'] ?? 10),
            'criteria' => array_map(fn (array $criterion) => [
                'key' => $criterion['key'],
                'label' => $criterion['name_vi'] ?? $criterion['name'] ?? $criterion['key'],
                'max' => (int) ($criterion['max_score'] ?? 10),
            ], $rubric->criteria),
        ];
    }
}
