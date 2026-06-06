<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Enums\ExamSessionStatus;
use App\Models\AssessmentJob;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersionListeningSection;
use App\Models\GrammarPoint;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingTask;
use App\Models\PracticeWritingPrompt;
use App\Models\User;
use App\Models\VocabTopic;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Dashboard summary — aggregate counts for admin overview.
 *
 * Trước đây các query DB::table() raw nằm trong DashboardController.
 * Sau refactor: tất cả dùng Eloquent Model, service tách riêng.
 */
final class AdminDashboardService
{
    /** @return array<string,mixed> */
    public function stats(): array
    {
        $today = CarbonImmutable::now()->startOfDay();
        $week = CarbonImmutable::now()->subDays(7)->startOfDay();

        $assessmentPending = AssessmentJob::query()->where('status', AssessmentJobStatus::Pending)->count();
        $assessmentFailed = AssessmentJob::query()->where('status', AssessmentJobStatus::Failed)->count();
        $assessmentDoneToday = AssessmentJob::query()
            ->where('status', AssessmentJobStatus::Ready)
            ->where('completed_at', '>=', $today)
            ->count();

        return [
            'users_total' => User::query()->count(),
            'users_today' => User::query()->where('created_at', '>=', $today)->count(),
            'users_this_week' => User::query()->where('created_at', '>=', $week)->count(),
            'exams_total' => Exam::query()->count(),
            'exams_published' => Exam::query()->where('is_published', true)->count(),
            'exams_draft' => Exam::query()->where('is_published', false)->count(),
            'sessions_active' => ExamSession::query()->where('status', ExamSessionStatus::Active)->count(),
            'sessions_today' => ExamSession::query()->where('created_at', '>=', $today)->count(),
            'sessions_stuck' => ExamSession::query()
                ->where('status', ExamSessionStatus::Active)
                ->where('server_deadline_at', '<', now())
                ->count(),
            'grading_pending' => $assessmentPending,
            'grading_failed' => $assessmentFailed,
            'grading_done_today' => $assessmentDoneToday,
            'assessment_pending' => $assessmentPending,
            'assessment_failed' => $assessmentFailed,
            'assessment_done_today' => $assessmentDoneToday,
            'vocab_topics' => VocabTopic::query()->count(),
            'grammar_points' => GrammarPoint::query()->count(),
            'courses' => Course::query()->count(),
        ];
    }

    /** @return list<array{type:string,message:string,action:string}> */
    public function alerts(): array
    {
        $alerts = [];
        $today = CarbonImmutable::now()->toDateString();

        $failedJobs = AssessmentJob::query()->where('status', AssessmentJobStatus::Failed)->count();
        if ($failedJobs > 0) {
            $alerts[] = [
                'type' => 'error',
                'message' => "{$failedJobs} assessment job thất bại cần retry",
                'action' => '/assessments',
            ];
        }

        $examListeningSectionsMissingAudio = ExamVersionListeningSection::query()
            ->whereHas('version', function (Builder $version): void {
                $version->where('is_active', true)
                    ->whereHas('exam', fn (Builder $exam) => $exam->where('is_published', true));
            })
            ->where(function (Builder $query): void {
                $query->whereNull('audio_url')
                    ->orWhere('audio_url', '');
            })
            ->count();
        if ($examListeningSectionsMissingAudio > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$examListeningSectionsMissingAudio} đoạn nghe trong đề thi chưa có file audio",
                'action' => '/exams',
            ];
        }

        $expiredPublishedCourses = Course::query()
            ->where('is_published', true)
            ->whereDate('end_date', '<', $today)
            ->count();
        if ($expiredPublishedCourses > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$expiredPublishedCourses} khóa học đã hết hạn nhưng vẫn đang published",
                'action' => '/courses',
            ];
        }

        return $alerts;
    }

    /** @return list<array{label:string,action:string,badge:int}> */
    public function actionItems(): array
    {
        $items = [];

        $draftExams = Exam::query()->where('is_published', false)->count();
        if ($draftExams > 0) {
            $items[] = ['label' => "{$draftExams} đề thi chưa xuất bản", 'action' => '/exams', 'badge' => $draftExams];
        }

        $failedJobs = AssessmentJob::query()->where('status', AssessmentJobStatus::Failed)->count();
        if ($failedJobs > 0) {
            $items[] = ['label' => "{$failedJobs} assessment job cần retry", 'action' => '/assessments', 'badge' => $failedJobs];
        }

        $unpublishedVocab = VocabTopic::query()->where('is_published', false)->count();
        if ($unpublishedVocab > 0) {
            $items[] = ['label' => "{$unpublishedVocab} chủ đề từ vựng chưa xuất bản", 'action' => '/vocab', 'badge' => $unpublishedVocab];
        }

        return $items;
    }

    /** @return list<array{type:string,published:int,draft:int}> */
    public function contentStatus(): array
    {
        return [
            ['type' => 'Đề thi',            'published' => Exam::query()->where('is_published', true)->count(),                       'draft' => Exam::query()->where('is_published', false)->count()],
            ['type' => 'Chủ đề từ vựng',    'published' => VocabTopic::query()->where('is_published', true)->count(),                'draft' => VocabTopic::query()->where('is_published', false)->count()],
            ['type' => 'Điểm ngữ pháp',     'published' => GrammarPoint::query()->where('is_published', true)->count(),              'draft' => GrammarPoint::query()->where('is_published', false)->count()],
            ['type' => 'Bài nghe',          'published' => PracticeListeningExercise::query()->where('is_published', true)->count(), 'draft' => PracticeListeningExercise::query()->where('is_published', false)->count()],
            ['type' => 'Bài đọc',           'published' => PracticeReadingExercise::query()->where('is_published', true)->count(),  'draft' => PracticeReadingExercise::query()->where('is_published', false)->count()],
            ['type' => 'Bài viết',          'published' => PracticeWritingPrompt::query()->where('is_published', true)->count(),    'draft' => PracticeWritingPrompt::query()->where('is_published', false)->count()],
            ['type' => 'Bài phát âm',       'published' => PracticeSpeakingDrill::query()->where('is_published', true)->count(),     'draft' => PracticeSpeakingDrill::query()->where('is_published', false)->count()],
            ['type' => 'Bài nói',           'published' => PracticeSpeakingTask::query()->where('is_published', true)->count(),      'draft' => PracticeSpeakingTask::query()->where('is_published', false)->count()],
        ];
    }

    /** @return list<array{action:string,detail:string,happened_at:string}> */
    public function recentActivity(): array
    {
        $activities = collect()
            ->merge(User::query()->selectRaw("'user_registered' as action, email as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get())
            ->merge(Exam::query()->where('is_published', true)->selectRaw("'exam_published' as action, title as detail, updated_at as happened_at")->orderByDesc('updated_at')->limit(3)->get())
            ->merge(VocabTopic::query()->selectRaw("'vocab_created' as action, name as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get())
            ->merge(GrammarPoint::query()->selectRaw("'grammar_created' as action, name as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get());

        return $activities
            ->sortByDesc('happened_at')
            ->take(5)
            ->values()
            ->map(fn ($item): array => [
                'action' => $item->action,
                'detail' => $item->detail,
                'happened_at' => $item->happened_at,
            ])
            ->all();
    }
}
