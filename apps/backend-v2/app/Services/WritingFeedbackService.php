<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Models\PracticeWritingSubmission;
use App\Models\Profile;
use App\Models\WritingGradingResult;

/**
 * On-demand feedback generation — separate from scoring pipeline.
 *
 * Practice users pay 1 token to get AI feedback after seeing their scores.
 * Exam feedback is generated automatically but shown after the exam ends.
 */
final class WritingFeedbackService
{
    public function __construct(
        private readonly WritingFeedbackGenerator $generator,
    ) {}

    /**
     * Generate AI feedback for an existing graded submission.
     *
     * @return array{strengths: string[], improvements: string[], rewrites: string[]}
     */
    public function generate(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array
    {
        return $this->generator->generate($text, $promptText, $metrics, $grammarErrors, $bandContext);
    }

    /**
     * Generate feedback from existing grading result + submission.
     *
     * @return array{strengths: string[], improvements: list<array{message: string, explanation: string}>, rewrites: string[]}
     */
    public function generateForSubmission(PracticeWritingSubmission $submission, WritingGradingResult $result): array
    {
        $promptText = (string) ($submission->prompt?->prompt ?? '');
        $bandContext = $this->resolveBandContext($submission);

        $feedback = $this->generate(
            text: (string) ($submission->text ?? ''),
            promptText: $promptText,
            metrics: [], // No metrics in storage — regenerate or use result
            grammarErrors: [],
            bandContext: $bandContext,
        );

        return [
            'strengths' => $feedback['strengths'],
            'improvements' => array_map(fn (string $s) => ['message' => $s, 'explanation' => ''], $feedback['improvements']),
            'rewrites' => $feedback['rewrites'],
        ];
    }

    /** @return array{current: string, target: string}|null */
    private function resolveBandContext(PracticeWritingSubmission $submission): ?array
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
