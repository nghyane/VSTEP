<?php

use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AudioController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\GradingController;
use App\Http\Controllers\Api\V1\GrammarController;
use App\Http\Controllers\Api\V1\McqPracticeController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OverviewController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\SpeakingPracticeController;
use App\Http\Controllers\Api\V1\VocabController;
use App\Http\Controllers\Api\V1\WalletController;
use App\Http\Controllers\Api\V1\WritingPracticeController;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        $checks = [];
        try {
            DB::select('SELECT 1');
            $checks['db'] = 'ok';
        } catch (Throwable) {
            $checks['db'] = 'fail';
        }
        try {
            Cache::store('redis')->get('health');
            $checks['redis'] = 'ok';
        } catch (Throwable) {
            $checks['redis'] = 'fail';
        }
        $healthy = ! in_array('fail', $checks, true);

        return response()->json(['status' => $healthy ? 'ok' : 'degraded', ...$checks], $healthy ? 200 : 503);
    });

    Route::get('/config', [ConfigController::class, 'show']);

    // Auth (public, rate limited)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/google', [AuthController::class, 'googleLogin']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    });

    // Auth (protected, no active profile required — admin/teacher fit here)
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/switch-profile', [AuthController::class, 'switchProfile']);
        Route::post('/auth/complete-onboarding', [AuthController::class, 'completeOnboarding']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Profile CRUD — scoped by authenticated account.
        Route::get('/profiles', [ProfileController::class, 'index']);
        Route::post('/profiles', [ProfileController::class, 'store']);
        Route::get('/profiles/{id}', [ProfileController::class, 'show']);
        Route::patch('/profiles/{id}', [ProfileController::class, 'update']);
        Route::delete('/profiles/{id}', [ProfileController::class, 'destroy']);
        Route::post('/profiles/{id}/reset', [ProfileController::class, 'reset']);
        Route::post('/profiles/{id}/onboarding', [ProfileController::class, 'onboarding']);
    });

    // Learner routes requiring active profile context.
    Route::middleware(['auth:api', 'active-profile'])->group(function () {
        Route::get('/wallet/balance', [WalletController::class, 'balance']);
        Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
        Route::get('/wallet/topup-packages', [WalletController::class, 'topupPackages']);
        Route::post('/wallet/topup', [WalletController::class, 'createTopup']);
        Route::post('/wallet/topup/{orderId}/confirm', [WalletController::class, 'confirmTopup']);
        Route::post('/wallet/promo-redeem', [WalletController::class, 'redeemPromo']);

        // Vocabulary foundation.
        Route::get('/vocab/topics', [VocabController::class, 'topics']);
        Route::get('/vocab/topics/{id}', [VocabController::class, 'topicDetail']);
        Route::get('/vocab/srs/queue', [VocabController::class, 'srsQueue']);
        Route::post('/vocab/srs/review', [VocabController::class, 'review']);
        Route::post('/vocab/exercises/{id}/attempt', [VocabController::class, 'attemptExercise']);

        // Grammar foundation.
        Route::get('/grammar/points', [GrammarController::class, 'points']);
        Route::get('/grammar/points/{id}', [GrammarController::class, 'pointDetail']);
        Route::post('/grammar/exercises/{id}/attempt', [GrammarController::class, 'attemptExercise']);

        // Practice MCQ skills (listening, reading). Path uses {skill} placeholder.
        Route::get('/practice/{skill}/exercises', [McqPracticeController::class, 'listExercises'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::get('/practice/{skill}/exercises/{id}', [McqPracticeController::class, 'showExercise'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::post('/practice/{skill}/sessions', [McqPracticeController::class, 'startSession'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::post('/practice/{skill}/sessions/{sessionId}/support', [McqPracticeController::class, 'useSupport'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::post('/practice/{skill}/sessions/{sessionId}/submit', [McqPracticeController::class, 'submit'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::get('/practice/{skill}/progress', [McqPracticeController::class, 'progress'])
            ->whereIn('skill', ['listening', 'reading']);

        // Practice Writing.
        Route::get('/practice/writing/prompts', [WritingPracticeController::class, 'listPrompts']);
        Route::get('/practice/writing/prompts/{id}', [WritingPracticeController::class, 'showPrompt']);
        Route::get('/practice/writing/history', [WritingPracticeController::class, 'history']);
        Route::post('/practice/writing/sessions', [WritingPracticeController::class, 'startSession']);
        Route::post('/practice/writing/sessions/{sessionId}/support', [WritingPracticeController::class, 'useSupport']);
        Route::post('/practice/writing/sessions/{sessionId}/submit', [WritingPracticeController::class, 'submit']);

        // Practice Speaking — drill + VSTEP.
        Route::get('/practice/speaking/drills', [SpeakingPracticeController::class, 'listDrills']);
        Route::get('/practice/speaking/drills/{id}', [SpeakingPracticeController::class, 'showDrill']);
        Route::get('/practice/speaking/tasks', [SpeakingPracticeController::class, 'listTasks']);
        Route::get('/practice/speaking/tasks/{id}', [SpeakingPracticeController::class, 'showTask']);
        Route::get('/practice/speaking/drill-history', [SpeakingPracticeController::class, 'drillHistory']);
        Route::get('/practice/speaking/vstep-history', [SpeakingPracticeController::class, 'vstepHistory']);
        Route::post('/practice/speaking/drill-sessions', [SpeakingPracticeController::class, 'startDrillSession']);
        Route::post('/practice/speaking/vstep-sessions', [SpeakingPracticeController::class, 'startVstepSession']);
        Route::post('/practice/speaking/drill-sessions/{sessionId}/attempt', [SpeakingPracticeController::class, 'drillAttempt']);
        Route::post('/practice/speaking/vstep-sessions/{sessionId}/submit', [SpeakingPracticeController::class, 'submitVstep']);

        // Exams (mock test).
        Route::get('/exams', [ExamController::class, 'index']);
        Route::get('/exams/{id}', [ExamController::class, 'show']);
        Route::post('/exams/{examId}/sessions', [ExamController::class, 'startSession']);
        Route::get('/exam-sessions/active', [ExamController::class, 'activeSession']);
        Route::get('/exam-sessions', [ExamController::class, 'mySessions']);
        Route::get('/exam-sessions/{sessionId}', [ExamController::class, 'showSession']);
        Route::get('/exam-sessions/{sessionId}/results', [ExamController::class, 'sessionResults']);
        Route::post('/exam-sessions/{sessionId}/submit', [ExamController::class, 'submit']);
        Route::post('/exam-sessions/{sessionId}/listening-played', [ExamController::class, 'logListeningPlayed']);
        Route::get('/exam-sessions/{sessionId}/listening-played', [ExamController::class, 'listeningPlaySummary']);
        Route::get('/exam-sessions/{sessionId}/writing-results', [ExamController::class, 'writingResults']);
        Route::get('/exam-sessions/{sessionId}/speaking-results', [ExamController::class, 'speakingResults']);

        // Grading.
        Route::get('/grading/jobs/{id}', [GradingController::class, 'showJob']);
        Route::get('/grading/jobs/{id}/status', [GradingController::class, 'jobStatus']);
        Route::get('/grading/writing/{submissionType}/{submissionId}', [GradingController::class, 'writingResult']);
        Route::get('/grading/speaking/{submissionType}/{submissionId}', [GradingController::class, 'speakingResult']);

        // Audio presigned URLs (R2).
        Route::post('/audio/presign-upload', [AudioController::class, 'presignUpload']);
        Route::post('/audio/presign-download', [AudioController::class, 'presignDownload']);

        // Overview & progress.
        Route::get('/overview', [OverviewController::class, 'overview']);
        Route::get('/streak', [OverviewController::class, 'streak']);
        Route::get('/activity-heatmap', [OverviewController::class, 'activityHeatmap']);

        // Courses.
        Route::get('/courses', [CourseController::class, 'index']);
        Route::get('/courses/{id}', [CourseController::class, 'show']);
        Route::post('/courses/{id}/enrollment-orders', [CourseController::class, 'createEnrollmentOrder']);
        Route::get('/courses/enrollment-orders', [CourseController::class, 'enrollmentOrders']);
        Route::post('/courses/enrollment-orders/{orderId}/confirm', [CourseController::class, 'confirmEnrollmentOrder']);
        Route::post('/courses/{courseId}/bookings', [CourseController::class, 'bookSlot']);

        // Notifications.
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    });

    // Admin/Staff routes (role >= staff)
    Route::middleware(['auth:api', 'role:staff'])->prefix('admin')->group(function () {
        Route::get('/stats', [Admin\DashboardController::class, 'stats']);
        Route::get('/alerts', [Admin\DashboardController::class, 'alerts']);
        Route::get('/action-items', [Admin\DashboardController::class, 'actionItems']);
        Route::get('/content-status', [Admin\DashboardController::class, 'contentStatus']);
        Route::get('/recent-activity', [Admin\DashboardController::class, 'recentActivity']);

        // Exam management
        Route::post('/exams/import', [Admin\ExamController::class, 'import']);
    });
});
