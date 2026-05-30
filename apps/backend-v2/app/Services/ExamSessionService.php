<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Services\AssessmentIntakeService;
use App\DTOs\ExamSubmitResult;
use App\Enums\CoinTransactionType;
use App\Enums\ExamSessionStatus;
use App\Exceptions\NotOwnerException;
use App\Models\Exam;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSessionDraft;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersion;
use App\Models\ExamWritingSubmission;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ExamSessionService
{
    /** Grace period cho submit sau deadline — clock skew FE/BE. */
    private const SUBMIT_GRACE_SECONDS = 30;

    public function __construct(
        private readonly WalletService $walletService,
        private readonly ExamScoringService $scoringService,
        private readonly AssessmentIntakeService $assessments,
        private readonly ProgressService $progressService,
        private readonly EconomyConfigService $economyConfig,
    ) {}

    /** @return Collection<int,Exam> */
    public function listPublished(): Collection
    {
        return Exam::query()
            ->where('is_published', true)
            ->whereHas('versions', fn ($q) => $q->where('is_active', true))
            ->withCount(['sessions as attempts_count' => fn ($q) => $q->whereIn('status', ExamSessionStatus::countableValues())])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function getExamWithActiveVersion(string $examId): array
    {
        /** @var Exam $exam */
        $exam = Exam::query()->findOrFail($examId);
        $version = $exam->activeVersion();
        if ($version === null) {
            abort(404, 'Đề thi chưa có phiên bản hoạt động.');
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

        // Fast-path: reject trước khi vào transaction nếu đã có session active.
        // Concurrency guard thật nằm trong transaction sau spend lock (P5-A fix).
        $hasActive = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('exam_version_id', $version->id)
            ->where('status', ExamSessionStatus::Active)
            ->where('server_deadline_at', '>', now())
            ->exists();
        if ($hasActive) {
            throw ValidationException::withMessages([
                'session' => ['Bạn đang có một lượt làm dở của đề này. Hãy tiếp tục hoặc hủy trước khi bắt đầu lượt mới.'],
            ]);
        }

        $cost = $this->computeCost($selectedSkills);
        $totalMinutes = $this->computeDuration($version, $selectedSkills);
        $deadlineMinutes = (int) ceil($totalMinutes * $timeExtensionFactor);

        return DB::transaction(function () use (
            $profile, $version, $mode, $selectedSkills, $isFullTest,
            $timeExtensionFactor, $cost, $deadlineMinutes,
        ) {
            $type = $isFullTest ? CoinTransactionType::ExamFull : CoinTransactionType::ExamCustom;
            // spend() locks profile row → serializes concurrent requests.
            $this->walletService->spend($profile, $cost, $type);

            // Re-check after lock — nếu request B đã tạo session trong lúc A chờ lock,
            // detect ở đây và rollback (coin refund nhờ transaction).
            $stillActive = ExamSession::query()
                ->where('profile_id', $profile->id)
                ->where('exam_version_id', $version->id)
                ->where('status', ExamSessionStatus::Active)
                ->where('server_deadline_at', '>', now())
                ->exists();
            if ($stillActive) {
                throw ValidationException::withMessages([
                    'session' => ['Bạn đang có một lượt làm dở của đề này. Hãy tiếp tục hoặc hủy trước khi bắt đầu lượt mới.'],
                ]);
            }

            return ExamSession::create([
                'profile_id' => $profile->id,
                'exam_version_id' => $version->id,
                'mode' => $mode,
                'selected_skills' => $selectedSkills,
                'is_full_test' => $isFullTest,
                'time_extension_factor' => $timeExtensionFactor,
                'started_at' => now(),
                'server_deadline_at' => now()->addMinutes($deadlineMinutes),
                'status' => ExamSessionStatus::Active,
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
            throw new NotOwnerException;
        }
        if ($session->status !== ExamSessionStatus::Active) {
            throw ValidationException::withMessages(['session' => ['Session not active.']]);
        }
        if ($session->server_deadline_at->addSeconds(self::SUBMIT_GRACE_SECONDS)->isPast()) {
            throw ValidationException::withMessages(['session' => ['Session đã hết hạn.']]);
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
                'status' => ExamSessionStatus::Submitted,
                'submitted_at' => now(),
            ]);

            // Submit thành công — xóa draft autosave (FE đã gửi state cuối cùng).
            ExamSessionDraft::query()->where('session_id', $session->id)->delete();

            // Streak: chỉ tính full test. RFC 0017 — defer khỏi transaction để rollback an toàn.
            DB::afterCommit(fn () => $this->progressService->recordExamCompletion($session->fresh()));

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
                $job = $this->assessments->submitExamWriting($submission);
                $writingJobs[] = [
                    'submission_id' => $submission->id,
                    'job_id' => $job->id,
                    'status' => $job->status->value,
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
                $job = $this->assessments->submitExamSpeaking($submission);
                $speakingJobs[] = [
                    'submission_id' => $submission->id,
                    'job_id' => $job->id,
                    'status' => $job->status->value,
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
            return $this->economyConfig->examFullTestCost();
        }
        $perSkill = $this->economyConfig->examCustomPerSkillCost();
        $fullCost = $this->economyConfig->examFullTestCost();

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

    public function getDraft(Profile $profile, ExamSession $session): ?ExamSessionDraft
    {
        if ($session->profile_id !== $profile->id) {
            throw new NotOwnerException;
        }

        return ExamSessionDraft::query()->where('session_id', $session->id)->first();
    }

    /**
     * Upsert draft autosave snapshot. Chỉ chấp nhận khi session đang active và chưa quá deadline —
     * tránh restore lại đề đã đóng/đã submit.
     *
     * @param  array{
     *   skill_idx:int,
     *   mcq_answers:list<array{item_ref_type:string,item_ref_id:string,selected_index:int}>,
     *   writing_answers:list<array{task_id:string,text:string}>,
     *   speaking_marks:list<array{part_id:string,audio_url?:?string,duration_seconds?:?int}>,
     * }  $payload
     */
    public function saveDraft(Profile $profile, ExamSession $session, array $payload): ExamSessionDraft
    {
        if ($session->profile_id !== $profile->id) {
            throw new NotOwnerException;
        }
        if ($session->status !== ExamSessionStatus::Active || $session->server_deadline_at->isPast()) {
            throw ValidationException::withMessages(['session' => ['Session not active.']]);
        }

        return ExamSessionDraft::query()->updateOrCreate(
            ['session_id' => $session->id],
            [
                'skill_idx' => $payload['skill_idx'],
                'mcq_answers' => $payload['mcq_answers'],
                'writing_answers' => $payload['writing_answers'],
                'speaking_marks' => $payload['speaking_marks'],
                'saved_at' => now(),
            ],
        );
    }
}
