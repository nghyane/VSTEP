<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Ai\Agents\SpeakingGrader;
use App\Ai\Agents\WritingGrader;
use App\Enums\NotificationType;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Enums\VstepBand;
use App\Models\GradingRubric;
use App\Models\KnowledgePoint;
use App\Models\Submission;
use App\Services\NotificationService;
use App\Services\ProgressService;
use App\Services\PronunciationService;
use App\Services\SessionService;
use App\Services\SpeakingUploadService;
use App\Services\WeakPointService;
use App\Support\VstepScoring;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

#[Backoff([5, 15, 60])]
class GradeSubmission implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 180;

    public function __construct(
        private readonly string $submissionId,
    ) {}

    public function handle(
        ProgressService $progressService,
        NotificationService $notificationService,
        PronunciationService $pronunciation,
    ): void {
        // Atomically claim: only one job can grade this submission
        $claimed = Submission::where('id', $this->submissionId)
            ->where('status', SubmissionStatus::Pending)
            ->update(['status' => SubmissionStatus::Processing]);

        // Recover stale claims: if a previous worker was killed mid-processing,
        // the submission stays in Processing forever. Reset and re-claim.
        if (! $claimed) {
            $staleClaimed = Submission::where('id', $this->submissionId)
                ->where('status', SubmissionStatus::Processing)
                ->where('updated_at', '<', now()->subSeconds($this->timeout + 30))
                ->update(['status' => SubmissionStatus::Processing, 'updated_at' => now()]);

            if (! $staleClaimed) {
                return;
            }

            Log::warning('grading_stale_claim_recovered', ['submission_id' => $this->submissionId]);
        }

        $submission = Submission::with('question.knowledgePoints')->findOrFail($this->submissionId);

        $rubric = GradingRubric::with('criteria')
            ->where('skill', $submission->skill)
            ->where('level', $submission->question->level)
            ->where('is_active', true)
            ->firstOrFail();

        $knowledgeScope = $this->expandKnowledgeScope($submission->question->knowledgePoints, $submission->skill);

        $pronunciationData = null;
        if ($submission->skill === Skill::Speaking) {
            $audioPath = $this->extractSpeakingAudioPath($submission);
            app(SpeakingUploadService::class)->verifyAudioOwnership(
                $audioPath,
                $submission->user_id,
            );
            $pronunciationData = $pronunciation->assessPronunciation($audioPath);
            Log::info('pronunciation_transcript_ready', [
                'submission_id' => $submission->id,
                'transcript_length' => strlen($pronunciationData['transcript']),
                'transcript_preview' => substr($pronunciationData['transcript'], 0, 120),
                'accuracy_score' => $pronunciationData['accuracy_score'],
                'fluency_score' => $pronunciationData['fluency_score'],
            ]);
            $result = $this->gradeSpeaking($submission, $rubric, $knowledgeScope, $pronunciationData);
        } else {
            $result = $this->gradeWriting($submission, $rubric, $knowledgeScope);
        }

        $this->validateAgentResult($result, $rubric);

        $criteriaScores = $this->normalizeScores($result['criteria_scores']);
        $overall = $this->calculateOverall($rubric, $criteriaScores);
        $validGaps = $this->validateGaps($result['knowledge_gaps'], $knowledgeScope);
        $confidence = $this->parseConfidence($result['confidence']);

        $status = $confidence === 'low'
            ? SubmissionStatus::ReviewPending
            : SubmissionStatus::Completed;

        $enrichedCriteria = $this->enrichCriteria($rubric, $criteriaScores);
        $enrichedGaps = KnowledgePoint::enrichGaps($validGaps);

        // Wrap finalization in transaction so progress + submission are atomic
        DB::transaction(function () use ($submission, $status, $overall, $enrichedCriteria, $enrichedGaps, $confidence, $result, $pronunciationData, $progressService) {
            $resultData = [
                'type' => 'ai_agent',
                'criteria' => $enrichedCriteria,
                'knowledge_gaps' => $enrichedGaps,
                'confidence' => $confidence,
                'graded_at' => now()->toAtomString(),
            ];

            if ($submission->practiceSession?->mode) {
                $resultData['scaffolding_type'] = $submission->practiceSession->mode->value;
            }

            if ($pronunciationData) {
                $resultData['pronunciation'] = $pronunciationData;
            }

            $submission->update([
                'status' => $status,
                'score' => $overall,
                'band' => VstepBand::fromScore($overall),
                'result' => $resultData,
                'feedback' => $result['feedback'],
                'completed_at' => $status === SubmissionStatus::Completed ? now() : null,
            ]);

            $progressService->applySubmission($submission);

            app(WeakPointService::class)->recordFromSubmission($submission->fresh());
        });

        $notificationMessage = $status === SubmissionStatus::Completed
            ? "Bạn đạt {$overall}/10 cho bài {$submission->skill->value}."
            : "Bài {$submission->skill->value} đã được chấm ({$overall}/10) và đang chờ review.";

        $notificationService->send(
            $submission->user_id,
            NotificationType::GradingComplete,
            'Bài làm đã được chấm điểm',
            $notificationMessage,
            ['submission_id' => $submission->id, 'score' => $overall],
        );

        Log::info('graded', ['submission_id' => $submission->id, 'score' => $overall, 'confidence' => $confidence]);

        if ($submission->session) {
            app(SessionService::class)->updateSubjectiveScores($submission);
        }
    }

    protected function gradeWriting(Submission $submission, GradingRubric $rubric, $knowledgeScope): array
    {
        $agent = new WritingGrader($submission, $rubric, $knowledgeScope);
        $agent->prompt($submission->answer['text'] ?? '');

        return $agent->getResult()
            ?? throw new RuntimeException('WritingGrader did not call SubmitWritingGrade tool.');
    }

    protected function gradeSpeaking(Submission $submission, GradingRubric $rubric, $knowledgeScope, array $pronunciationData): array
    {
        $agent = new SpeakingGrader($submission, $rubric, $knowledgeScope, $pronunciationData);
        $agent->prompt($pronunciationData['transcript']);

        return $agent->getResult()
            ?? throw new RuntimeException('SpeakingGrader did not call SubmitSpeakingGrade tool.');
    }

    /**
     * Expand question's knowledge points by 1 hop (parents + children + related).
     */
    private function expandKnowledgeScope($linkedKnowledgePoints, Skill $skill): Collection
    {
        $ids = $linkedKnowledgePoints->pluck('id')->toArray();

        if (empty($ids)) {
            return $this->fallbackKnowledgeScope($skill);
        }

        $expandedIds = collect($ids);

        $edges = DB::table('knowledge_point_edges')
            ->where(fn ($q) => $q->whereIn('parent_id', $ids)->orWhereIn('child_id', $ids))
            ->get();

        foreach ($edges as $edge) {
            $expandedIds->push($edge->parent_id, $edge->child_id);
        }

        return KnowledgePoint::whereIn('id', $expandedIds->unique())->get();
    }

    private function fallbackKnowledgeScope(Skill $skill): Collection
    {
        $categories = match ($skill) {
            Skill::Writing => ['grammar', 'vocabulary', 'discourse', 'strategy'],
            Skill::Speaking => ['grammar', 'vocabulary', 'pronunciation', 'strategy'],
            default => [],
        };

        return KnowledgePoint::whereIn('category', $categories)->get();
    }

    /**
     * Validate agent returned all expected criteria and valid values.
     */
    private function validateAgentResult(array $result, GradingRubric $rubric): void
    {
        $expectedKeys = $rubric->criteria->pluck('key')->toArray();
        $returnedKeys = array_keys($result['criteria_scores'] ?? []);

        $missing = array_diff($expectedKeys, $returnedKeys);
        if (! empty($missing)) {
            throw new RuntimeException('Agent missing criteria: '.implode(', ', $missing));
        }

        foreach ($result['criteria_scores'] as $key => $score) {
            if (! is_numeric($score) || $score < 0 || $score > 10) {
                throw new RuntimeException("Invalid score for {$key}: {$score}");
            }
        }

        if (empty($result['feedback'])) {
            throw new RuntimeException('Agent returned empty feedback.');
        }
    }

    private function normalizeScores(array $scores): array
    {
        return array_map(fn ($score) => VstepScoring::round((float) $score), $scores);
    }

    /**
     * Calculate weighted average overall score.
     */
    private function calculateOverall(GradingRubric $rubric, array $criteriaScores): float
    {
        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($rubric->criteria as $criterion) {
            $score = $criteriaScores[$criterion->key] ?? 0;
            $weightedSum += $score * $criterion->weight;
            $totalWeight += $criterion->weight;
        }

        if ($totalWeight <= 0) {
            throw new RuntimeException('Rubric has zero total weight.');
        }

        return VstepScoring::round($weightedSum / $totalWeight);
    }

    private function validateGaps(array $gaps, $knowledgeScope): array
    {
        $normalizedGaps = array_map(fn ($g) => mb_strtolower(trim(
            preg_replace('/\s*\([^)]*\)\s*$/', '', $g),
        )), $gaps);

        return $knowledgeScope->pluck('name')
            ->filter(fn ($name) => in_array(mb_strtolower(trim($name)), $normalizedGaps))
            ->values()
            ->toArray();
    }

    /**
     * Normalize confidence to allowed values.
     */
    private function parseConfidence(string $raw): string
    {
        $normalized = mb_strtolower(trim($raw));

        return in_array($normalized, ['high', 'medium', 'low']) ? $normalized : 'medium';
    }

    private function extractSpeakingAudioPath(Submission $submission): string
    {
        $answer = $submission->answer;
        $audioPath = $answer['audio_path'] ?? $answer['audioPath'] ?? $answer['audio_url'] ?? null;

        if (! is_string($audioPath) || $audioPath === '' || str_starts_with($audioPath, 'blob:')) {
            throw new RuntimeException('Speaking submission is missing an uploaded audio path.');
        }

        return $audioPath;
    }

    /**
     * Enrich criteria scores with names and band labels for FE.
     */
    private function enrichCriteria(GradingRubric $rubric, array $criteriaScores): array
    {
        return $rubric->criteria->map(function ($criterion) use ($criteriaScores) {
            $score = $criteriaScores[$criterion->key] ?? 0;
            $bandLabel = $this->getBandLabel($criterion->band_descriptors, $score);

            return [
                'key' => $criterion->key,
                'name' => $criterion->name,
                'score' => $score,
                'band_label' => $bandLabel,
            ];
        })->toArray();
    }

    private function getBandLabel(array $bandDescriptors, float $score): string
    {
        foreach ($bandDescriptors as $range => $description) {
            [$min, $max] = array_map('floatval', explode('-', $range));
            if ($score >= $min && $score <= $max) {
                return $description;
            }
        }

        return '';
    }

    public function failed(\Throwable $e): void
    {
        $submission = Submission::find($this->submissionId);
        if ($submission && $submission->status === SubmissionStatus::Processing) {
            $submission->update(['status' => SubmissionStatus::Failed]);
        }

        if ($submission?->session) {
            app(SessionService::class)->updateSubjectiveScores($submission);
        }

        if ($submission) {
            app(NotificationService::class)->send(
                $submission->user_id,
                NotificationType::System,
                'Chấm điểm thất bại',
                "Bài {$submission->skill->value} không thể chấm. Vui lòng thử lại.",
                ['submission_id' => $submission->id],
            );
        }

        Log::error('grading_failed', ['submission_id' => $this->submissionId, 'error' => $e->getMessage()]);
    }
}
