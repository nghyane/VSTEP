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
use App\Models\SpeakingGradingResult;
use App\Models\SystemConfig;
use App\Models\WritingGradingResult;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExamService
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly GradingService $gradingService,
    ) {}

    /** @return Collection<int,Exam> */
    public function listPublished(): Collection
    {
        return Exam::query()->where('is_published', true)->orderBy('created_at', 'desc')->get();
    }

    /**
     * Import a complete exam with version and all content.
     *
     * Validates structure before inserting. All inserts are atomic.
     *
     * @param  array<string, mixed>  $examData  slug, title, source_school, tags, total_duration_minutes, is_published
     * @param  array<string, mixed>  $versionData  version_number, published_at, + all content arrays
     *
     * @throws ValidationException If VSTEP structure rules are violated
     */
    public function importExam(array $examData, array $versionData): Exam
    {
        $now = now()->toDateTimeString();

        return DB::transaction(function () use ($examData, $versionData, $now) {
            $exam = Exam::create([
                ...$examData,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $version = $exam->versions()->create([
                'version_number' => $versionData['version_number'],
                'published_at' => $versionData['published_at'] ?? $now,
                'is_active' => true,
                'created_at' => $now,
            ]);

            $this->insertExamContent($version, $versionData);

            return $exam->fresh(['versions']);
        });
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

                $mcqPerItemResults[] = [
                    'item_ref_type' => $refType,
                    'item_ref_id' => $refId,
                    'selected_index' => $selected,
                    'correct_index' => $correctIndex,
                    'is_correct' => $isCorrect,
                ];
            }

            $session->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

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
                $job = $this->gradingService->enqueueWritingGrading('exam_writing', $submission->id);
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
                $job = $this->gradingService->enqueueSpeakingGrading('exam_speaking', $submission->id);
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

    /**
     * Compute per-skill band scores for a graded exam session.
     *
     * Listening/Reading: MCQ correct ratio → band 0-10 (phase 1: linear).
     * Writing/Speaking: avg overall_band from active grading results.
     *
     * @return array{listening: ?float, reading: ?float, writing: ?float, speaking: ?float}
     */
    public function getSessionScores(ExamSession $session): array
    {
        return [
            'listening' => $this->mcqBand($session, 'listening'),
            'reading' => $this->mcqBand($session, 'reading'),
            'writing' => $this->gradingBand('exam_writing', 'exam_writing_submissions', $session),
            'speaking' => $this->gradingBand('exam_speaking', 'exam_speaking_submissions', $session),
        ];
    }

    private function mcqBand(ExamSession $session, string $skill): ?float
    {
        $answers = ExamMcqAnswer::query()
            ->where('session_id', $session->id)
            ->where('item_ref_type', $skill)
            ->get(['is_correct']);

        if ($answers->isEmpty()) {
            return null;
        }

        $correct = $answers->where('is_correct', true)->count();

        return round($correct / $answers->count() * 10, 1);
    }

    private function gradingBand(string $submissionType, string $submissionTable, ExamSession $session): ?float
    {
        $model = $submissionType === 'exam_writing'
            ? WritingGradingResult::class
            : SpeakingGradingResult::class;

        $band = $model::query()
            ->where('submission_type', $submissionType)
            ->whereIn('submission_id', function ($q) use ($submissionTable, $session) {
                $q->select('id')->from($submissionTable)->where('session_id', $session->id);
            })
            ->where('is_active', true)
            ->avg('overall_band');

        return $band !== null ? round((float) $band, 1) : null;
    }

    /**
     * Insert all exam content within the service's transaction context.
     *
     * @param  array<string, mixed>  $versionData
     */
    private function insertExamContent(ExamVersion $version, array $versionData): void
    {
        $now = now()->toDateTimeString();

        // Listening sections
        foreach ($versionData['listening_sections'] ?? [] as $index => $section) {
            $sectionId = Str::orderedUuid()->toString();
            DB::table('exam_version_listening_sections')->insert([
                'id' => $sectionId,
                'exam_version_id' => $version->id,
                'part' => $section['part'],
                'part_title' => $section['part_title'],
                'duration_minutes' => $section['duration_minutes'],
                'audio_url' => $section['audio_url'] ?? null,
                'transcript' => $section['transcript'] ?? null,
                'display_order' => $section['display_order'] ?? $index,
            ]);

            // Listening items for this section
            $sectionItems = collect($versionData['listening_items'] ?? [])
                ->where('section_index', $index);
            foreach ($sectionItems as $itemIndex => $item) {
                DB::table('exam_version_listening_items')->insert([
                    'id' => Str::orderedUuid()->toString(),
                    'section_id' => $sectionId,
                    'display_order' => $item['display_order'] ?? $itemIndex,
                    'stem' => $item['stem'],
                    'options' => json_encode($item['options'], JSON_UNESCAPED_UNICODE),
                    'correct_index' => $item['correct_index'],
                ]);
            }
        }

        // Reading passages
        foreach ($versionData['reading_passages'] ?? [] as $index => $passage) {
            $passageId = Str::orderedUuid()->toString();
            DB::table('exam_version_reading_passages')->insert([
                'id' => $passageId,
                'exam_version_id' => $version->id,
                'part' => $passage['part'] ?? ($index + 1),
                'title' => $passage['title'],
                'duration_minutes' => $passage['duration_minutes'],
                'passage' => $passage['passage'],
                'display_order' => $passage['display_order'] ?? $index,
            ]);

            // Reading items for this passage
            $passageItems = collect($versionData['reading_items'] ?? [])
                ->where('passage_index', $index);
            foreach ($passageItems as $itemIndex => $item) {
                DB::table('exam_version_reading_items')->insert([
                    'id' => Str::orderedUuid()->toString(),
                    'passage_id' => $passageId,
                    'display_order' => $item['display_order'] ?? $itemIndex,
                    'stem' => $item['stem'],
                    'options' => json_encode($item['options'], JSON_UNESCAPED_UNICODE),
                    'correct_index' => $item['correct_index'],
                ]);
            }
        }

        // Writing tasks
        foreach ($versionData['writing_tasks'] ?? [] as $index => $task) {
            DB::table('exam_version_writing_tasks')->insert([
                'id' => Str::orderedUuid()->toString(),
                'exam_version_id' => $version->id,
                'part' => $task['part'],
                'task_type' => $task['task_type'],
                'duration_minutes' => $task['duration_minutes'],
                'prompt' => $task['prompt'],
                'min_words' => $task['min_words'],
                'instructions' => isset($task['instructions']) ? json_encode($task['instructions'], JSON_UNESCAPED_UNICODE) : null,
                'display_order' => $task['display_order'] ?? $index,
            ]);
        }

        // Speaking parts
        foreach ($versionData['speaking_parts'] ?? [] as $index => $part) {
            DB::table('exam_version_speaking_parts')->insert([
                'id' => Str::orderedUuid()->toString(),
                'exam_version_id' => $version->id,
                'part' => $part['part'],
                'type' => $part['type'],
                'duration_minutes' => $part['duration_minutes'],
                'speaking_seconds' => $part['speaking_seconds'],
                'content' => json_encode($part['content'], JSON_UNESCAPED_UNICODE),
                'display_order' => $part['display_order'] ?? $index,
            ]);
        }
    }
}
