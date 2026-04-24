<?php

declare(strict_types=1);

namespace App\Services;

use App\Ai\Agents\StructuredGradingAgent;
use App\Jobs\GradeSpeakingJob;
use App\Jobs\GradeWritingJob;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeWritingSubmission;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Responses\StructuredAgentResponse;

/**
 * Grading pipeline — 3 layers:
 *
 * Layer 1: LanguageTool (grammar detection, offset-level, deterministic)
 * Layer 2: Rule-based scoring caps (deterministic, 0ms)
 * Layer 3: LLM via OpenAI-compatible endpoint (rubric scoring + narrative feedback)
 *
 * Architecture:
 *   text → LanguageTool → annotations[]
 *   text + annotations context → LLM → rubric_scores + strengths + improvements + rewrites
 *   merge → writing_grading_results / speaking_grading_results
 *
 * Queue: dispatch GradeWritingJob / GradeSpeakingJob (async, retry up to 3 times).
 */
class SpeakingGradingService
{
    public function __construct(
        private readonly SpeechToTextService $sttService,
        private readonly AudioStorageService $audioService,
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly StructuredGradingAgent $structuredGradingAgent,
    ) {}

    private function llmBaseUrl(): string
    {
        return rtrim((string) config('grading.llm.base_url', 'http://localhost:11434'), '/');
    }

    private function llmModel(): string
    {
        return (string) config('grading.llm.model', 'gemini-3-flash-preview');
    }

    private function llmApiKey(): string
    {
        return (string) config('grading.llm.api_key', '');
    }

    public function enqueueWritingGrading(string $submissionType, string $submissionId): GradingJob
    {
        $job = GradingJob::create([
            'submission_type' => $submissionType,
            'submission_id' => $submissionId,
            'status' => 'pending',
        ]);

        GradeWritingJob::dispatch($job->id);

        return $job->refresh();
    }

    public function enqueue(string $submissionType, string $submissionId): GradingJob
    {
        $job = GradingJob::create([
            'submission_type' => $submissionType,
            'submission_id' => $submissionId,
            'status' => 'pending',
        ]);

        GradeSpeakingJob::dispatch($job->id);

        return $job->refresh();
    }

    public function processWritingJob(GradingJob $job): void
    {
        DB::transaction(function () use ($job) {
            $job->update(['status' => 'processing', 'started_at' => now(), 'attempts' => $job->attempts + 1]);

            $submission = $this->loadWritingSubmission($job);
            $text = $submission?->text ?? '';
            $promptText = match (true) {
                $submission instanceof PracticeWritingSubmission => $submission?->prompt?->prompt ?? '',
                $submission instanceof ExamWritingSubmission => $submission?->task?->prompt ?? '',
                default => '',
            };

            // Layer 1: LanguageTool grammar detection (rule-based, deterministic).
            $ltMatches = $this->languageTool->check($text);
            $annotations = $this->languageTool->toAnnotations($text, $ltMatches);

            // Layer 2: Rule-based scoring caps (deterministic, 0ms).
            $ruleAnalysis = $this->ruleScoring->analyze($text, $ltMatches);

            // Layer 3: LLM rubric scoring + feedback.
            $llmResult = $this->callLlmWritingGrading($text, $promptText, $ltMatches, $ruleAnalysis);

            // Layer 4: Score reconciliation — cap LLM when too generous.
            $reconciledScores = $this->ruleScoring->reconcile(
                $llmResult['rubric_scores'],
                $ruleAnalysis['caps'],
            );
            $llmResult['rubric_scores'] = $reconciledScores;
            $llmResult['overall_band'] = $this->computeOverallBand($reconciledScores);

            // Merge: LLM feedback + LanguageTool annotations + rule metrics.
            $mergedAnnotations = array_merge($annotations, $llmResult['annotations'] ?? []);

            // Versioning.
            $version = WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->max('version') ?? 0;

            WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            WritingGradingResult::create([
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
                'rubric_scores' => $llmResult['rubric_scores'],
                'overall_band' => $llmResult['overall_band'],
                'strengths' => $llmResult['strengths'],
                'improvements' => $llmResult['improvements'],
                'rewrites' => $llmResult['rewrites'],
                'annotations' => $mergedAnnotations,
                'paragraph_feedback' => [],
            ]);

            $job->update(['status' => 'ready', 'completed_at' => now()]);
        });
    }

    public function process(GradingJob $job): void
    {
        DB::transaction(function () use ($job) {
            $job->update(['status' => 'processing', 'started_at' => now(), 'attempts' => $job->attempts + 1]);

            $submission = $this->loadSpeakingSubmission($job);
            $transcript = 'Transcript unavailable.';
            $pronunciationScore = 0;

            if ($submission !== null && $submission->audio_url) {
                $sttResult = $this->sttService->transcribeFromStorage($submission->audio_url, $this->audioService);
                if ($sttResult !== null) {
                    $transcript = $sttResult['text'];
                    $pronunciationScore = (int) ($sttResult['confidence'] * 100);
                    $submission->update(['transcript' => $transcript]);
                }
            }

            // LLM grading on transcript.
            $llmResult = $this->callLlmSpeakingGrading($transcript);

            $version = SpeakingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->max('version') ?? 0;

            SpeakingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            SpeakingGradingResult::create([
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
                'rubric_scores' => $llmResult['rubric_scores'],
                'overall_band' => $llmResult['overall_band'],
                'strengths' => $llmResult['strengths'],
                'improvements' => $llmResult['improvements'],
                'pronunciation_report' => ['accuracy_score' => $pronunciationScore],
                'transcript' => $transcript,
            ]);

            $job->update(['status' => 'ready', 'completed_at' => now()]);
        });
    }

    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors  from LanguageTool
     * @param  array{caps: array, metrics: array, flags: string[]}  $ruleAnalysis
     * @return array{rubric_scores: array, overall_band: float, strengths: array, improvements: array, rewrites: array, annotations: array}
     */
    private function callLlmWritingGrading(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis): array
    {
        $errorContext = '';
        if (! empty($grammarErrors)) {
            $errorSummary = array_map(fn ($e) => "- \"{$e['message']}\" (offset {$e['offset']})", array_slice($grammarErrors, 0, 10));
            $errorContext = "\n\nGrammar errors detected by automated checker:\n".implode("\n", $errorSummary);
        }

        $metrics = $ruleAnalysis['metrics'];
        $caps = $ruleAnalysis['caps'];
        $errorContext .= "\n\nText metrics:";
        $errorContext .= "\n- Words: {$metrics['word_count']}, Sentences: {$metrics['sentence_count']}, Paragraphs: {$metrics['paragraph_count']}";
        $errorContext .= "\n- Errors/sentence: {$metrics['errors_per_sentence']}, Unique word ratio: {$metrics['unique_ratio']}";
        $errorContext .= "\n- Linking words found: {$metrics['linking_word_count']}";

        $capContext = array_filter($caps, fn ($v) => $v !== null);
        if (! empty($capContext)) {
            $errorContext .= "\n\nScore constraints (do NOT exceed these):";
            foreach ($capContext as $criterion => $cap) {
                $errorContext .= "\n- {$criterion} max: {$cap}";
            }
        }

        $systemPrompt = <<<'PROMPT'
You are a VSTEP writing examiner. Grade the student's writing using the Vietnamese MOE rubric.

Rubric (each criterion scored 0-4):
- Task Achievement: covers required points, appropriate format/tone, sufficient development
- Coherence & Cohesion: logical organization, paragraph structure, linking devices
- Lexical Resource: vocabulary range, accuracy, appropriateness
- Grammatical Range & Accuracy: sentence variety, error frequency, complexity

Overall band = (sum of 4 scores / 16) × 10, rounded to 0.5.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "rubric_scores": {"task_achievement": X.X, "coherence": X.X, "lexical": X.X, "grammar": X.X},
  "overall_band": X.X,
  "strengths": ["strength 1", "strength 2"],
  "improvements": [{"message": "what to improve", "explanation": "how to improve it"}],
  "rewrites": [{"original": "original sentence", "improved": "better version", "reason": "why"}],
  "annotations": []
}
PROMPT;

        $userMessage = "Task prompt: {$promptText}\n\nStudent's writing:\n{$text}\n\nWord count: ".str_word_count($text).$errorContext;

        return $this->callStructuredLlm($userMessage, $this->defaultWritingResult());
    }

    /**
     * @return array{rubric_scores: array, overall_band: float, strengths: array, improvements: array}
     */
    private function callLlmSpeakingGrading(string $transcript): array
    {
        $systemPrompt = <<<'PROMPT'
You are a VSTEP speaking examiner. Grade the student's spoken response (transcript from speech-to-text) using the Vietnamese MOE rubric.

Rubric (each criterion scored 0-4):
- Fluency & Coherence: natural flow, hesitation, logical development
- Pronunciation: clarity (assessed separately by audio analysis, use transcript quality as proxy)
- Lexical Resource: vocabulary range, accuracy
- Grammatical Range & Accuracy: sentence variety, error frequency
- Content & Task Fulfillment: relevance, development of ideas

Overall band = (sum of 5 scores / 20) × 10, rounded to 0.5.

Return ONLY valid JSON:
{
  "rubric_scores": {"fluency": X.X, "pronunciation": X.X, "content": X.X, "vocab": X.X, "grammar": X.X},
  "overall_band": X.X,
  "strengths": ["strength 1"],
  "improvements": [{"message": "what to improve", "explanation": "how"}]
}
PROMPT;

        return $this->callStructuredLlm(
            "Transcript:\n{$transcript}",
            $this->defaultSpeakingResult(),
        );
    }

    /**
     * @return array<string,mixed>
     */
    private function callStructuredLlm(string $prompt, array $fallback): array
    {
        try {
            $response = $this->structuredGradingAgent->prompt(
                prompt: $prompt,
                provider: 'llm',
                model: $this->llmModel(),
            );

            $structured = $response instanceof StructuredAgentResponse
                ? $response->structured
                : [];

            if (is_array($structured) && isset($structured['rubric_scores'])) {
                return $this->normalizeLlmResult(array_merge($fallback, $structured), $fallback);
            }

            Log::warning('Structured LLM grading: invalid structured output', [
                'response' => $structured,
                'url' => $this->llmBaseUrl(),
                'model' => $this->llmModel(),
            ]);

            return $fallback;
        } catch (\Throwable $e) {
            Log::error('Structured LLM grading exception', [
                'error' => $e->getMessage(),
                'url' => $this->llmBaseUrl(),
                'model' => $this->llmModel(),
            ]);

            return $fallback;
        }
    }

    private function defaultWritingResult(): array
    {
        return [
            'rubric_scores' => ['task_achievement' => 2.0, 'coherence' => 2.0, 'lexical' => 2.0, 'grammar' => 2.0],
            'overall_band' => 5.0,
            'strengths' => ['Submitted on time'],
            'improvements' => [['message' => 'AI grading unavailable', 'explanation' => 'Please try again later.']],
            'rewrites' => [],
            'annotations' => [],
        ];
    }

    /**
     * @param  array<string,mixed>  $result
     * @param  array<string,mixed>  $fallback
     * @return array<string,mixed>
     */
    private function normalizeLlmResult(array $result, array $fallback): array
    {
        $rubricScores = is_array($result['rubric_scores'] ?? null) ? $result['rubric_scores'] : [];
        $fallbackScores = is_array($fallback['rubric_scores'] ?? null) ? $fallback['rubric_scores'] : [];

        $keyMap = [
            'task_completion' => 'task_achievement',
            'task_response' => 'task_achievement',
            'content' => 'task_achievement',
            'clarity' => 'coherence',
            'organization' => 'coherence',
            'style' => 'lexical',
            'vocab' => 'lexical',
            'vocabulary' => 'lexical',
        ];

        foreach ($keyMap as $from => $to) {
            if (! array_key_exists($to, $rubricScores) && array_key_exists($from, $rubricScores)) {
                $rubricScores[$to] = $rubricScores[$from];
            }
        }

        foreach ($fallbackScores as $key => $value) {
            $rubricScores[$key] = $this->normalizeNumericScore($rubricScores[$key] ?? $value, $value);
        }

        $result['rubric_scores'] = $rubricScores;
        $result['overall_band'] = is_numeric($result['overall_band'] ?? null)
            ? (float) $result['overall_band']
            : $this->computeOverallBand($rubricScores);
        $result['strengths'] = array_values(array_filter((array) ($result['strengths'] ?? []), fn ($item) => is_string($item) && $item !== ''));
        $result['rewrites'] = array_values(is_array($result['rewrites'] ?? null) ? $result['rewrites'] : []);
        $result['annotations'] = array_values(is_array($result['annotations'] ?? null) ? $result['annotations'] : []);
        $result['improvements'] = $this->normalizeImprovements($result['improvements'] ?? $fallback['improvements'] ?? []);

        return $result;
    }

    private function normalizeNumericScore(mixed $value, float $fallback): float
    {
        if (! is_numeric($value)) {
            return $fallback;
        }

        return max(0.0, min(4.0, (float) $value));
    }

    /**
     * @return array<int,array{message:string,explanation:string}>
     */
    private function normalizeImprovements(mixed $improvements): array
    {
        $items = is_array($improvements) ? $improvements : [];

        return array_values(array_map(function (mixed $item): array {
            if (is_string($item)) {
                return [
                    'message' => $item,
                    'explanation' => $item,
                ];
            }

            if (is_array($item)) {
                return [
                    'message' => (string) ($item['message'] ?? $item['explanation'] ?? 'Needs improvement'),
                    'explanation' => (string) ($item['explanation'] ?? $item['message'] ?? 'Needs improvement'),
                ];
            }

            return [
                'message' => 'Needs improvement',
                'explanation' => 'Needs improvement',
            ];
        }, $items));
    }

    private function defaultSpeakingResult(): array
    {
        return [
            'rubric_scores' => ['fluency' => 2.0, 'pronunciation' => 2.0, 'content' => 2.0, 'vocab' => 2.0, 'grammar' => 2.0],
            'overall_band' => 5.0,
            'strengths' => ['Completed the task'],
            'improvements' => [['message' => 'AI grading unavailable', 'explanation' => 'Please try again later.']],
        ];
    }

    private function loadWritingSubmission(GradingJob $job): PracticeWritingSubmission|ExamWritingSubmission|null
    {
        return match ($job->submission_type) {
            'practice_writing' => PracticeWritingSubmission::query()->with('prompt')->find($job->submission_id),
            'exam_writing' => ExamWritingSubmission::query()->with('task')->find($job->submission_id),
            default => null,
        };
    }

    private function loadSpeakingSubmission(GradingJob $job): PracticeSpeakingSubmission|ExamSpeakingSubmission|null
    {
        return match ($job->submission_type) {
            'practice_speaking' => PracticeSpeakingSubmission::query()->find($job->submission_id),
            'exam_speaking' => ExamSpeakingSubmission::query()->find($job->submission_id),
            default => null,
        };
    }

    /**
     * @param  array<string,float>  $scores
     */
    private function computeOverallBand(array $scores): float
    {
        $sum = array_sum($scores);
        $count = count($scores);
        if ($count === 0) {
            return 5.0;
        }

        $raw = ($sum / ($count * 4)) * 10;

        return round($raw * 2) / 2; // Round to nearest 0.5
    }
}
