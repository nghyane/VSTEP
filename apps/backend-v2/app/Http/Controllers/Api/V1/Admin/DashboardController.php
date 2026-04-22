<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $today = now()->startOfDay();
        $week = now()->subDays(7)->startOfDay();

        $stats = [
            // Users
            'users_total' => DB::table('users')->count(),
            'users_today' => DB::table('users')->where('created_at', '>=', $today)->count(),
            'users_this_week' => DB::table('users')->where('created_at', '>=', $week)->count(),

            // Exams
            'exams_total' => DB::table('exams')->count(),
            'exams_published' => DB::table('exams')->where('is_published', true)->count(),
            'exams_draft' => DB::table('exams')->where('is_published', false)->count(),

            // Exam sessions
            'sessions_active' => DB::table('exam_sessions')->where('status', 'in_progress')->count(),
            'sessions_today' => DB::table('exam_sessions')->where('created_at', '>=', $today)->count(),
            'sessions_stuck' => DB::table('exam_sessions')
                ->where('status', 'in_progress')
                ->where('server_deadline_at', '<', now())
                ->count(),

            // Grading
            'grading_pending' => DB::table('grading_results')->where('status', 'pending')->count(),
            'grading_failed' => DB::table('grading_results')->where('status', 'failed')->count(),
            'grading_done_today' => DB::table('grading_results')
                ->where('status', 'done')
                ->where('updated_at', '>=', $today)
                ->count(),

            // Content
            'vocab_topics' => DB::table('vocab_topics')->count(),
            'grammar_points' => DB::table('grammar_points')->count(),
            'courses' => DB::table('courses')->count(),
        ];

        return response()->json(['data' => $stats]);
    }

    public function alerts(): JsonResponse
    {
        $alerts = [];

        $failedJobs = DB::table('grading_results')->where('status', 'failed')->count();
        if ($failedJobs > 0) {
            $alerts[] = [
                'type' => 'error',
                'message' => "{$failedJobs} grading job thất bại cần retry",
                'action' => '/grading',
            ];
        }

        $stuckSessions = DB::table('exam_sessions')
            ->where('status', 'in_progress')
            ->where('server_deadline_at', '<', now())
            ->count();
        if ($stuckSessions > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$stuckSessions} phiên thi đã quá hạn, chưa nộp",
                'action' => '/exams/sessions',
            ];
        }

        $missingAudio = DB::table('exam_version_listening_sections')
            ->whereNull('audio_url')
            ->orWhere('audio_url', '')
            ->count();
        if ($missingAudio > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$missingAudio} phần nghe chưa có audio",
                'action' => '/exams',
            ];
        }

        return response()->json(['data' => $alerts]);
    }

    public function actionItems(): JsonResponse
    {
        $items = [];

        $draftExams = DB::table('exams')->where('is_published', false)->count();
        if ($draftExams > 0) {
            $items[] = [
                'label' => "{$draftExams} đề thi chưa xuất bản",
                'action' => '/exams',
                'badge' => $draftExams,
            ];
        }

        $failedJobs = DB::table('grading_results')->where('status', 'failed')->count();
        if ($failedJobs > 0) {
            $items[] = [
                'label' => "{$failedJobs} grading job cần retry",
                'action' => '/grading',
                'badge' => $failedJobs,
            ];
        }

        $unpublishedVocab = DB::table('vocab_topics')->where('is_published', false)->count();
        if ($unpublishedVocab > 0) {
            $items[] = [
                'label' => "{$unpublishedVocab} chủ đề từ vựng chưa xuất bản",
                'action' => '/vocab',
                'badge' => $unpublishedVocab,
            ];
        }

        return response()->json(['data' => $items]);
    }

    public function contentStatus(): JsonResponse
    {
        $items = [
            ['type' => 'Đề thi',           'published' => DB::table('exams')->where('is_published', true)->count(),                       'draft' => DB::table('exams')->where('is_published', false)->count()],
            ['type' => 'Chủ đề từ vựng',   'published' => DB::table('vocab_topics')->where('is_published', true)->count(),                'draft' => DB::table('vocab_topics')->where('is_published', false)->count()],
            ['type' => 'Điểm ngữ pháp',    'published' => DB::table('grammar_points')->where('is_published', true)->count(),              'draft' => DB::table('grammar_points')->where('is_published', false)->count()],
            ['type' => 'Bài nghe',          'published' => DB::table('practice_listening_exercises')->where('is_published', true)->count(), 'draft' => DB::table('practice_listening_exercises')->where('is_published', false)->count()],
            ['type' => 'Bài đọc',           'published' => DB::table('practice_reading_exercises')->where('is_published', true)->count(),  'draft' => DB::table('practice_reading_exercises')->where('is_published', false)->count()],
            ['type' => 'Bài viết',          'published' => DB::table('practice_writing_prompts')->where('is_published', true)->count(),    'draft' => DB::table('practice_writing_prompts')->where('is_published', false)->count()],
            ['type' => 'Bài phát âm',       'published' => DB::table('practice_speaking_drills')->count(),                                 'draft' => 0],
            ['type' => 'Bài nói',           'published' => DB::table('practice_speaking_tasks')->count(),                                  'draft' => 0],
        ];

        return response()->json(['data' => $items]);
    }

    public function recentActivity(): JsonResponse
    {
        $activities = collect();

        foreach ([
            [DB::table('users')->selectRaw("'user_registered' as action, email as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get()],
            [DB::table('exams')->where('is_published', true)->selectRaw("'exam_published' as action, title as detail, updated_at as happened_at")->orderByDesc('updated_at')->limit(3)->get()],
            [DB::table('vocab_topics')->selectRaw("'vocab_created' as action, name as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get()],
            [DB::table('grammar_points')->selectRaw("'grammar_created' as action, name as detail, created_at as happened_at")->orderByDesc('created_at')->limit(3)->get()],
        ] as [$rows]) {
            $activities = $activities->merge($rows);
        }

        $result = $activities
            ->sortByDesc('happened_at')
            ->take(5)
            ->values()
            ->map(fn ($item) => [
                'action' => $item->action,
                'detail' => $item->detail,
                'happened_at' => $item->happened_at,
            ]);

        return response()->json(['data' => $result]);
    }
}
