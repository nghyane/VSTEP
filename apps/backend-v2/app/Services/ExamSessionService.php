<?php

declare(strict_types=1);

namespace App\Services;

use App\DTOs\ExamSubmitResult;
use App\Enums\CoinTransactionType;
use App\Models\Exam;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersion;
use App\Models\ExamWritingSubmission;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\SystemConfig;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamSessionService
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly ExamScoringService $scoringService,
        private readonly WritingGradingService $writingGradingService,
        private readonly SpeakingGradingService $speakingGradingService,
        private readonly ProgressService $progressService,
    ) {}

    /** @return Collection<int,Exam> */
    public function listPublished(): Collection
    {
        return Exam::query()
            ->where('is_published', true)
            ->withCount(['sessions as attempts_count' => fn ($q) => $q->whereIn('status', ['submitted', 'graded', 'auto_submitted'])])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getExamWithActiveVersion(string $examId): array
    {
        /** @var Exam $exam */
        $exam = Exam::query()->findOrFail($examId);
        $version = $exam->activeVersion();
        if ($version === null) {
            throw ValidationException::withMessages(['exam' => ['Không có phiên bản đang hoạt động.']]);
        }
        $version->load([
            'listeningSections.items', 'readingPassages.items',
            'writingTasks', 'speakingParts',
        ]);

        return ['exam' => $exam, 'version' => $version];
    }

    /**
     * Start exam session. Atomic coin charge.
     *
     * @param  array<int,string>  $selectedSkills
     */
    public function startSession(
        Profile $profile,
        ExamVersion $version,
        string $mode,
        array $selectedSkills,
        float $timeExtensionFactor = 1.0,
    ): ExamSession {
        $allSkills = ['listening', 'reading', 'writing', 'speaking'];
        $isFullTest = $mode === 'full' || count(array_intersect($selectedSkills, $allSkills)) === 4;
        if ($mode === 'full') {
            $selectedSkills = $allSkills;
        }

        $cost = $this->computeCost($selectedSkills);
        $totalMinutes = $this->computeDuration($version, $selectedSkills);
        $deadlineMinutes = (int) ceil($totalMinutes * $timeExtensionFactor);

        return DB::transaction(function () use (
            $profile, $version, $mode, $selectedSkills, $isFullTest,
            $timeExtensionFactor, $cost, $deadlineMinutes,
        ) {
            $type = $isFullTest ? CoinTransactionType::ExamFull : CoinTransactionType::ExamCustom;
            $this->walletService->spend($profile, $cost, $type);

            return ExamSession::create([
                'profile_id' => $profile->id,
                'exam_version_id' => $version->id,
                'mode' => $mode,
                'selected_skills' => $selectedSkills,
                'is_full_test' => $isFullTest,
                'time_extension_factor' => $timeExtensionFactor,
                'started_at' => now(),
                'server_deadline_at' => now()->addMinutes($deadlineMinutes),
                'status' => 'active',
                'coins_charged' => $cost,
            ]);
        });
    }

    /**
     * Submit exam. Chấm MCQ sync. Writing/speaking → tạo submission + dispatch grading jobs.
     *
     * @param  array<int,array{item_ref_type:string,item_ref_id:string,selected_index:int}>  $mcqAnswers
     * @param  array<int,array{task_id:string,text:string,word_count:int}>  $writingAnswers
     * @param  array<int,array{part_id:string,audio_url:string,duration_seconds:int}>  $speakingAnswers
     */
    public function submit(
        Profile $profile,
        ExamSession $session,
        array $mcqAnswers = [],
        array $writingAnswers = [],
        array $speakingAnswers = [],
    ): ExamSubmitResult {
        if ($session->profile_id !== $profile->id) {
            abort(403);
        }
        if (! in_array($session->status, ['active'], true)) {
            throw ValidationException::withMessages(['session' => ['Session not active.']]);
        }

        return DB::transaction(function () use ($session, $mcqAnswers, $writingAnswers, $speakingAnswers) {
            // ── 1. MCQ grading (sync) ──
            $mcqPerItemResults = [];
            $mcqScore = 0;

            $itemMap = $this->scoringService->loadMcqItemMap($session);

            // Total = số câu MCQ thuộc các kỹ năng đã chọn trong session.
            // Câu không trả lời tính là sai (total cố định, score chỉ lên khi đúng).
            $skills = $session->selected_skills ?? [];
            $mcqTotal = 0;
            foreach ($itemMap as $key => $_correct) {
                if (str_starts_with($key, 'exam_listening_item:') && in_array('listening', $skills, true)) {
                    $mcqTotal++;
                } elseif (str_starts_with($key, 'exam_reading_item:') && in_array('reading', $skills, true)) {
                    $mcqTotal++;
                }
            }

            foreach ($mcqAnswers as $answer) {
                $refType = $answer['item_ref_type'];
                $refId = $answer['item_ref_id'];
                $selected = (int) $answer['selected_index'];
                $correctIndex = $itemMap["{$refType}:{$refId}"] ?? null;
                if ($correctIndex === null) {
                    continue;
                }
                $isCorrect = $selected === $correctIndex;
                if ($isCorrect) {
                    $mcqScore++;
                }

                ExamMcqAnswer::updateOrCreate(
                    ['session_id' => $session->id, 'item_ref_type' => $refType, 'item_ref_id' => $refId],
                    ['selected_index' => $selected, 'is_correct' => $isCorrect, 'answered_at' => now()],
                );

                $mcqPerItemResults[] = [
                    'item_ref_type' => $refType,
                    'item_ref_id' => $refId,
                    'selected_index' => $selected,
                    'correct_index' => $correctIndex,
                    'is_correct' => $isCorrect,
                ];
            }

            // Record daily activity
            ProfileDailyActivity::addActivity($session->profile_id, 'exam_session');

            $session->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            // Streak: chỉ tính full test. RFC 0017 — defer khỏi transaction để rollback an toàn.
            $progressService = $this->progressService;
            DB::afterCommit(fn () => $progressService->recordExamCompletion($session->fresh()));

            // ── 2. Writing submissions + grading jobs ──
            $writingJobs = [];
            foreach ($writingAnswers as $w) {
                $submission = ExamWritingSubmission::create([
                    'session_id' => $session->id,
                    'profile_id' => $session->profile_id,
                    'task_id' => $w['task_id'],
                    'text' => $w['text'],
                    'word_count' => $w['word_count'],
                    'submitted_at' => now(),
                ]);
                $job = $this->writingGradingService->enqueue('exam_writing', $submission->id);
                $writingJobs[] = [
                    'submission_id' => $submission->id,
                    'job_id' => $job->id,
                    'status' => $job->status,
                ];
            }

            // ── 3. Speaking submissions + grading jobs ──
            $speakingJobs = [];
            foreach ($speakingAnswers as $s) {
                $submission = ExamSpeakingSubmission::create([
                    'session_id' => $session->id,
                    'profile_id' => $session->profile_id,
                    'part_id' => $s['part_id'],
                    'audio_url' => $s['audio_url'],
                    'duration_seconds' => $s['duration_seconds'],
                    'submitted_at' => now(),
                ]);
                $job = $this->speakingGradingService->enqueue('exam_speaking', $submission->id);
                $speakingJobs[] = [
                    'submission_id' => $submission->id,
                    'job_id' => $job->id,
                    'status' => $job->status,
                ];
            }

            return new ExamSubmitResult(
                $session->refresh(),
                $mcqScore,
                $mcqTotal,
                $mcqPerItemResults,
                $writingJobs,
                $speakingJobs,
            );
        });
    }

    /** @param  array<int,string>  $skills */
    private function computeCost(array $skills): int
    {
        $allSkills = ['listening', 'reading', 'writing', 'speaking'];
        if (count(array_intersect($skills, $allSkills)) === 4) {
            return (int) (SystemConfig::get('exam.full_test_cost_coins') ?? 25);
        }
        $perSkill = (int) (SystemConfig::get('exam.custom_per_skill_coins') ?? 8);
        $fullCost = (int) (SystemConfig::get('exam.full_test_cost_coins') ?? 25);

        return min($fullCost, $perSkill * count($skills));
    }

    /** @param  array<int,string>  $skills */
    private function computeDuration(ExamVersion $version, array $skills): int
    {
        $total = 0;
        if (in_array('listening', $skills, true)) {
            $total += $version->listeningSections->sum('duration_minutes');
        }
        if (in_array('reading', $skills, true)) {
            $total += $version->readingPassages->sum('duration_minutes');
        }
        if (in_array('writing', $skills, true)) {
            $total += $version->writingTasks->sum('duration_minutes');
        }
        if (in_array('speaking', $skills, true)) {
            $total += $version->speakingParts->sum('duration_minutes');
        }

        return max($total, 1);
    }
}
