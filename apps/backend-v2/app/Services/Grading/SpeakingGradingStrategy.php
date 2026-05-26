<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\GradingResultData;
use App\DTOs\Grading\SpeakingGradingData;
use App\Enums\GradingJobStatus;
use App\Exceptions\GradingFailedException;
use App\Models\ExamSpeakingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\SpeakingGradingResult;
use App\Services\AudioStorageService;
use App\Services\RuleBasedScoringService;
use App\Services\SpeechToText;
use App\Services\SyntaxAnalyzer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class SpeakingGradingStrategy implements GradingStrategy
{
    public function __construct(
        private readonly SpeechToText $stt,
        private readonly AudioStorageService $audio,
        private readonly SyntaxAnalyzer $syntax,
        private readonly RuleBasedScoringService $metrics,
        private readonly SpeakingScoringFormula $formula,
        private readonly LlmGrader $llm,
        private readonly RubricResolver $rubricResolver,
    ) {}

    public function supports(): array
    {
        return ['practice_speaking', 'exam_speaking'];
    }

    public function loadSubmission(GradingJob $job): ?Model
    {
        return match ($job->submission_type) {
            'practice_speaking' => PracticeSpeakingSubmission::query()->find($job->submission_id),
            'exam_speaking' => ExamSpeakingSubmission::query()->find($job->submission_id),
            default => null,
        };
    }

    public function grade(Model $submission): GradingResultData
    {
        $audioUrl = (string) ($submission->audio_url ?? '');
        if ($audioUrl === '') {
            throw new GradingFailedException('Speaking submission missing audio_url');
        }

        $rubric = $this->rubricResolver->active('speaking');

        $sttResult = $this->transcribeOrFail($audioUrl);

        $transcript = (string) $sttResult['text'];
        $sttConfidence = (float) $sttResult['confidence'];
        $speakingRate = (float) ($sttResult['speaking_rate'] ?? 0);
        $pauseCount = (int) ($sttResult['pause_count'] ?? 0);
        $sttWordCount = (int) ($sttResult['word_count'] ?? 0);

        $submission->update(['transcript' => $transcript]);

        $syntaxAnalysis = $this->syntax->analyze($transcript);
        $metricResult = $this->metrics->analyze($transcript, []);
        $metrics = $metricResult['metrics'];

        $azurePron = $sttResult['pronunciation'] ?? null;

        $scores = [
            'grammar' => $this->formula->grammar($syntaxAnalysis, 0, $metrics['sentence_count']),
            'vocabulary' => $this->formula->vocabulary($metrics),
            'fluency' => $this->formula->fluency($speakingRate, $pauseCount, $sttWordCount),
            'discourse_management' => $this->formula->discourse(
                $metrics['linking_word_count'],
                (float) ($metrics['sentence_variety'] ?? 0),
            ),
            'pronunciation' => $this->formula->pronunciation(
                $azurePron['overall'] ?? ($sttConfidence * 10),
            ),
        ];

        return new SpeakingGradingData(
            rubricScores: $scores,
            overallBand: $rubric->computeOverallBand($scores),
            strengths: [],
            improvements: $this->sttQualityNote($sttConfidence),
            transcript: $transcript,
            pronunciationReport: ['accuracy_score' => round($sttConfidence * 10, 1)],
            rubricId: $rubric->id,
        );
    }

    public function persistResult(GradingJob $job, GradingResultData $data): void
    {
        DB::transaction(function () use ($job, $data) {
            DB::statement('SELECT pg_advisory_xact_lock(?)', [crc32($job->submission_type.':'.$job->submission_id)]);

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
                ...$data->toModelAttributes(),
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
            ]);

            $job->update([
                'status' => GradingJobStatus::Ready,
                'completed_at' => now(),
            ]);
        });
    }

    private function sttQualityNote(float $confidence): array
    {
        if ($confidence >= 0.7) {
            return [];
        }

        return [[
            'message' => 'Chất lượng thu âm thấp (độ tin cậy: '.round($confidence * 100).'%). Điểm có thể bị ảnh hưởng bởi lỗi nhận dạng.',
            'explanation' => 'STT confidence below 0.7. Scores computed from transcript may include recognition errors.',
        ]];
    }

    /** @return array{text: string, confidence: float, speaking_rate: float, pause_count: int, word_count: int, pronunciation: ?array} */
    private function transcribeOrFail(string $audioUrl): array
    {
        try {
            $result = $this->stt->transcribeFromStorage($audioUrl, $this->audio);
        } catch (\RuntimeException $e) {
            throw new GradingFailedException(
                'Speech-to-text is not configured. Set AZURE_SPEECH_KEY to enable speaking grading.',
                previous: $e,
            );
        }

        if ($result === null) {
            throw new GradingFailedException(
                'Speech-to-text transcription failed. Audio may be corrupted or Azure service unavailable.',
            );
        }

        return $result;
    }
}
