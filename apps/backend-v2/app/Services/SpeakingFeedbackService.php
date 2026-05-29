<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\SpeakingFeedbackGenerator;
use App\Models\PracticeSpeakingSubmission;
use App\Models\Profile;
use App\Models\SpeakingGradingResult;
use Illuminate\Support\Facades\Log;

/**
 * On-demand AI speaking feedback — enhancement layer on top of insights.
 *
 * Practice users pay 1 token for AI-enhanced feedback.
 * Insights (deterministic) are always available from the grading result.
 *
 * @return array{strengths: list<string>, improvements: list<array{message: string, explanation: string}>}
 */
final class SpeakingFeedbackService
{
    public function __construct(
        private readonly SpeakingFeedbackGenerator $generator,
        private readonly RuleBasedScoringService $ruleScoring,
    ) {}

    /**
     * Generate feedback from existing grading result + submission.
     *
     * @return array{strengths: list<string>, improvements: list<array{message: string, explanation: string}>}
     */
    public function generateForSubmission(
        PracticeSpeakingSubmission $submission,
        SpeakingGradingResult $result,
    ): array {
        $task = $submission->speakingTask;
        $transcript = (string) ($submission->transcript ?? '');
        $promptText = (string) ($task?->prompt ?? '');
        $bandContext = $this->resolveBandContext($submission);
        $scores = (array) ($result->rubric_scores ?? []);

        try {
            $ruleAnalysis = $this->ruleScoring->analyze($transcript, []);

            $llmFeedback = $this->generator->generate(
                transcript: $transcript,
                promptText: $promptText,
                scores: $scores,
                metrics: $ruleAnalysis['metrics'],
                bandContext: $bandContext,
            );

            return [
                'strengths' => $llmFeedback['strengths'],
                'improvements' => array_map(
                    fn (string $s) => ['message' => $s, 'explanation' => ''],
                    $llmFeedback['improvements'],
                ),
            ];
        } catch (\Throwable $e) {
            Log::warning('Speaking LLM feedback failed, returning insights.', [
                'submission_id' => $submission->id,
                'error' => $e->getMessage(),
            ]);

            return $this->insightsFromResult($result);
        }
    }

    /**
     * Build feedback from stored insights (always available, zero-cost).
     */
    public function insightsFromResult(SpeakingGradingResult $result): array
    {
        $insights = (array) ($result->pronunciation_report['insights'] ?? []);
        $scores = (array) ($result->rubric_scores ?? []);

        if ($insights === []) {
            Log::warning('Speaking insights missing from grading result.', [
                'result_id' => $result->id,
            ]);

            return ['strengths' => [], 'improvements' => []];
        }

        $strengths = [];
        $improvements = [];

        foreach ($insights as $key => $insight) {
            $score = (float) ($scores[$key] ?? 0);
            $label = $insight['label'] ?? $key;
            $detail = $insight['detail'] ?? '';

            if ($score >= 7.0) {
                $strengths[] = "$label ($score/10): $detail";
            } else {
                $improvements[] = "$label ($score/10): $detail";
            }
        }

        return [
            'strengths' => $strengths,
            'improvements' => array_map(
                fn (string $s) => ['message' => $s, 'explanation' => ''],
                $improvements,
            ),
        ];
    }

    /** @return array{current: string, target: string}|null */
    private function resolveBandContext(PracticeSpeakingSubmission $submission): ?array
    {
        $profile = Profile::query()->find($submission->profile_id);
        if ($profile === null || $profile->entry_level === null) {
            return null;
        }

        return [
            'current' => $profile->entry_level,
            'target' => $profile->target_level ?? $profile->entry_level,
        ];
    }
}
