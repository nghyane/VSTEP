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
use App\Services\AzureSpeechService;
use App\Services\NotificationService;
use App\Services\ProgressService;
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
        AzureSpeechService $azureSpeech,
    ): void {
        // Atomic lock: only one job can grade this submission
        $submission = Submission::with('question.knowledgePoints')->findOrFail($this->submissionId);

        if (in_array($submission->status, [SubmissionStatus::Completed, SubmissionStatus::ReviewPending])) {
            return;
        }

        // Atomically claim this submission for grading
        $claimed = Submission::where('id', $this->submissionId)
            ->where('status', SubmissionStatus::Processing)
            ->update(['status' => SubmissionStatus::Processing]);

        if (! $claimed) {
            return;
        }

        $rubric = GradingRubric::with('criteria')
            ->where('skill', $submission->skill)
            ->where('level', $submission->question->level)
            ->where('is_active', true)
            ->firstOrFail();

        $knowledgeScope = $this->expandKnowledgeScope($submission->question->knowledgePoints);

        if ($submission->skill === Skill::Speaking) {
            $result = $this->gradeSpeaking($submission, $rubric, $knowledgeScope, $azureSpeech);
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
        $enrichedGaps = $this->enrichGaps($validGaps);

        // Wrap finalization in transaction so progress + submission are atomic
        DB::transaction(function () use ($submission, $status, $overall, $enrichedCriteria, $enrichedGaps, $confidence, $result, $progressService) {
            $submission->update([
                'status' => $status,
                'score' => $overall,
                'band' => VstepBand::fromScore($overall),
                'result' => [
                    'type' => 'ai_agent',
                    'criteria' => $enrichedCriteria,
                    'knowledge_gaps' => $enrichedGaps,
                    'confidence' => $confidence,
                    'graded_at' => now()->toAtomString(),
                ],
                'feedback' => $result['feedback'],
                'completed_at' => $status === SubmissionStatus::Completed ? now() : null,
            ]);

            if ($status === SubmissionStatus::Completed) {
                $progressService->applySubmission($submission);
            }
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

        // If this submission belongs to an exam session, update session scores
        if ($submission->session_id) {
            $this->updateSessionScores($submission);
        }
    }

    private function gradeWriting(Submission $submission, GradingRubric $rubric, $knowledgeScope): array
    {
        $agent = new WritingGrader($submission, $rubric, $knowledgeScope);
        $agent->prompt($submission->answer['text'] ?? '');

        return $agent->getResult()
            ?? throw new RuntimeException('WritingGrader did not call SubmitWritingGrade tool.');
    }

    private function gradeSpeaking(Submission $submission, GradingRubric $rubric, $knowledgeScope, AzureSpeechService $azureSpeech): array
    {
        $pronunciationData = $azureSpeech->assess($submission->answer['audio_path']);

        $agent = new SpeakingGrader($submission, $rubric, $knowledgeScope, $pronunciationData);
        $agent->prompt($pronunciationData['transcript']);

        return $agent->getResult()
            ?? throw new RuntimeException('SpeakingGrader did not call SubmitSpeakingGrade tool.');
    }

    /**
     * Expand question's knowledge points by 1 hop (parents + children + related).
     */
    private function expandKnowledgeScope($linkedKnowledgePoints): Collection
    {
        $ids = $linkedKnowledgePoints->pluck('id')->toArray();

        if (empty($ids)) {
            return new Collection;
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

    /**
     * Round all scores to nearest 0.5 increment.
     */
    private function normalizeScores(array $scores): array
    {
        return array_map(fn ($score) => round($score * 2) / 2, $scores);
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

    /**
     * Filter knowledge gaps to only valid names from the injected scope.
     * Case-insensitive trim matching.
     */
    private function validateGaps(array $gaps, $knowledgeScope): array
    {
        $validNames = $knowledgeScope->pluck('name')
            ->map(fn ($n) => mb_strtolower(trim($n)))
            ->toArray();

        return $knowledgeScope->pluck('name')
            ->filter(fn ($name) => in_array(mb_strtolower(trim($name)), array_map(fn ($g) => mb_strtolower(trim($g)), $gaps)))
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

    /**
     * Enrich knowledge gaps with graph path and metadata for FE.
     */
    private function enrichGaps(array $gapNames): array
    {
        return collect($gapNames)->map(function ($name) {
            $kp = KnowledgePoint::with('parents')->where('name', $name)->first();
            if (! $kp) {
                return null;
            }

            return [
                'name' => $kp->name,
                'category' => $kp->category->value,
                'description' => $kp->description,
                'path' => $this->buildAncestorPath($kp),
            ];
        })->filter()->values()->toArray();
    }

    private function buildAncestorPath(KnowledgePoint $kp): array
    {
        $path = [$kp->name];
        $current = $kp;
        $seen = [$kp->id];

        while ($parent = $current->parents->first(fn ($p) => $p->category->value === $kp->category->value && ! in_array($p->id, $seen))) {
            $path[] = $parent->name;
            $seen[] = $parent->id;
            $current = KnowledgePoint::with('parents')->find($parent->id);
        }

        return array_reverse($path);
    }

    /**
     * After grading a submission linked to an exam session,
     * check if all subjective submissions are graded and update session scores.
     *
     * Writing: (Task1 + Task2 × 2) / 3
     * Speaking: average(Part1, Part2, Part3)
     */
    private function updateSessionScores(Submission $submission): void
    {
        $sessionSubmissions = Submission::with('question')
            ->where('session_id', $submission->session_id)
            ->where('skill', $submission->skill)
            ->get();

        // All must be completed or review_pending (scored)
        if ($sessionSubmissions->contains(fn ($s) => $s->score === null)) {
            return;
        }

        $session = $submission->session;

        if ($submission->skill === Skill::Writing) {
            $task1 = $sessionSubmissions->first(fn ($s) => $s->question->part === 1);
            $task2 = $sessionSubmissions->first(fn ($s) => $s->question->part === 2);

            if ($task1?->score !== null && $task2?->score !== null) {
                $session->update([
                    'writing_score' => VstepScoring::writingOverall($task1->score, $task2->score),
                ]);
            } elseif ($sessionSubmissions->count() === 1) {
                // Single task practice within exam — just use that score
                $session->update(['writing_score' => $sessionSubmissions->first()->score]);
            }
        }

        if ($submission->skill === Skill::Speaking) {
            $partScores = $sessionSubmissions->pluck('score')->filter()->toArray();

            if (! empty($partScores)) {
                $session->update([
                    'speaking_score' => VstepScoring::speakingOverall(...$partScores),
                ]);
            }
        }

        // Recalculate overall if all skill scores are available
        $session->refresh();
        $scores = array_filter([
            $session->listening_score,
            $session->reading_score,
            $session->writing_score,
            $session->speaking_score,
        ], fn ($v) => $v !== null);

        if (count($scores) > 0) {
            $overall = VstepScoring::round(array_sum($scores) / count($scores));
            $session->update([
                'overall_score' => $overall,
                'overall_band' => VstepBand::fromScore($overall),
            ]);
        }
    }

    public function failed(\Throwable $e): void
    {
        $submission = Submission::find($this->submissionId);
        $submission?->update(['status' => SubmissionStatus::Failed]);

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
