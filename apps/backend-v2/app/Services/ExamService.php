<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Exam;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\SystemConfig;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExamService
{
    public function __construct(
        private readonly WalletService $walletService,
    ) {}

    /** @return Collection<int,Exam> */
    public function listPublished(): Collection
    {
        return Exam::query()->where('is_published', true)->orderBy('created_at', 'desc')->get();
    }

    public function getExamWithActiveVersion(string $examId): array
    {
        /** @var Exam $exam */
        $exam = Exam::query()->findOrFail($examId);
        $version = $exam->activeVersion();
        if ($version === null) {
            throw ValidationException::withMessages(['exam' => ['No active version.']]);
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
     * Submit exam. Chấm MCQ sync. Writing/speaking grading sẽ dispatch ở Slice 8.
     *
     * @param  array<int,array{item_ref_type:string,item_ref_id:string,selected_index:int}>  $mcqAnswers
     * @return array{session: ExamSession, mcq_score: int, mcq_total: int}
     */
    public function submit(
        Profile $profile,
        ExamSession $session,
        array $mcqAnswers = [],
    ): array {
        if ($session->profile_id !== $profile->id) {
            abort(403);
        }
        if (! in_array($session->status, ['active'], true)) {
            throw ValidationException::withMessages(['session' => ['Session not active.']]);
        }

        return DB::transaction(function () use ($session, $mcqAnswers) {
            $mcqScore = 0;
            $mcqTotal = 0;

            $itemMap = $this->loadMcqItemMap($session);

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
                $mcqTotal++;

                ExamMcqAnswer::updateOrCreate(
                    ['session_id' => $session->id, 'item_ref_type' => $refType, 'item_ref_id' => $refId],
                    ['selected_index' => $selected, 'is_correct' => $isCorrect, 'answered_at' => now()],
                );
            }

            $session->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            return [
                'session' => $session->refresh(),
                'mcq_score' => $mcqScore,
                'mcq_total' => $mcqTotal,
            ];
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

    /** @return array<string,int> key = "type:id", value = correct_index */
    private function loadMcqItemMap(ExamSession $session): array
    {
        $version = $session->examVersion;
        $version->load(['listeningSections.items', 'readingPassages.items']);
        $map = [];
        foreach ($version->listeningSections as $section) {
            foreach ($section->items as $item) {
                $map["exam_listening_item:{$item->id}"] = $item->correct_index;
            }
        }
        foreach ($version->readingPassages as $passage) {
            foreach ($passage->items as $item) {
                $map["exam_reading_item:{$item->id}"] = $item->correct_index;
            }
        }

        return $map;
    }
}
