<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AudioController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\GradingController;
use App\Http\Controllers\Api\V1\GrammarController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\McqPracticeController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OverviewController;
use App\Http\Controllers\Api\V1\PaymentCallbackController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\ShadowingProgressController;
use App\Http\Controllers\Api\V1\SpeakingConversationController;
use App\Http\Controllers\Api\V1\SpeakingPracticeController;
use App\Http\Controllers\Api\V1\VocabController;
use App\Http\Controllers\Api\V1\WalletController;
use App\Http\Controllers\Api\V1\WritingPracticeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', [HealthController::class, 'show']);

    Route::get('/config', [ConfigController::class, 'show']);

    // Payment gateway callbacks — NO AUTH (server-to-server from PayOS/VNPay).
    Route::post('/payment/callback/{provider}', [PaymentCallbackController::class, 'handle']);

    // Auth (public, rate limited)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/google', [AuthController::class, 'googleLogin']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::post('/auth/email/check', [AuthController::class, 'checkEmail']);
    });

    // Auth (protected, no active profile required — admin/teacher fit here)
    Route::middleware(['auth:api', 'throttle:60,1'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/switch-profile', [AuthController::class, 'switchProfile']);
        Route::post('/auth/complete-onboarding', [AuthController::class, 'completeOnboarding']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Self-service account ops (mọi role dùng được).
        Route::post('/me/change-password', [AccountController::class, 'changePassword']);

        // Profile CRUD — scoped by authenticated account.
        Route::get('/profiles', [ProfileController::class, 'index']);
        Route::post('/profiles', [ProfileController::class, 'store']);
        Route::get('/profiles/{profile}', [ProfileController::class, 'show']);
        Route::patch('/profiles/{profile}', [ProfileController::class, 'update']);
        Route::delete('/profiles/{profile}', [ProfileController::class, 'destroy']);
        Route::post('/profiles/{profile}/reset', [ProfileController::class, 'reset']);
        Route::post('/profiles/{profile}/onboarding', [ProfileController::class, 'onboarding']);
    });

    // Learner routes requiring active profile context.
    Route::middleware(['auth:api', 'active-profile'])->group(function () {
        Route::patch('/me/avatar', [AccountController::class, 'updateAvatar']);
        Route::post('/me/avatar', [AccountController::class, 'uploadAvatar']);

        Route::get('/wallet/balance', [WalletController::class, 'balance']);
        Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
        Route::get('/wallet/topup-packages', [WalletController::class, 'topupPackages']);
        Route::post('/wallet/topup', [WalletController::class, 'createTopup']);
        Route::get('/wallet/topup/{order}/status', [WalletController::class, 'orderStatus']);
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
        Route::post('/practice/{skill}/sessions/{practice_session}/support', [McqPracticeController::class, 'useSupport'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::post('/practice/{skill}/sessions/{practice_session}/submit', [McqPracticeController::class, 'submit'])
            ->whereIn('skill', ['listening', 'reading']);
        Route::get('/practice/{skill}/progress', [McqPracticeController::class, 'progress'])
            ->whereIn('skill', ['listening', 'reading']);

        // Practice Writing.
        Route::get('/practice/writing/prompts', [WritingPracticeController::class, 'listPrompts']);
        Route::get('/practice/writing/prompts/{id}', [WritingPracticeController::class, 'showPrompt']);
        Route::get('/practice/writing/history', [WritingPracticeController::class, 'history']);
        Route::post('/practice/writing/sessions', [WritingPracticeController::class, 'startSession']);
        Route::post('/practice/writing/sessions/{practice_session}/support', [WritingPracticeController::class, 'useSupport']);
        Route::post('/practice/writing/sessions/{practice_session}/submit', [WritingPracticeController::class, 'submit']);

        // Practice Speaking — drill + VSTEP.
        Route::get('/practice/speaking/drills', [SpeakingPracticeController::class, 'listDrills']);
        Route::get('/practice/speaking/drills/{id}', [SpeakingPracticeController::class, 'showDrill']);
        Route::get('/practice/speaking/tasks', [SpeakingPracticeController::class, 'listTasks']);
        Route::get('/practice/speaking/tasks/{id}', [SpeakingPracticeController::class, 'showTask']);
        Route::get('/practice/speaking/drill-history', [SpeakingPracticeController::class, 'drillHistory']);
        Route::get('/practice/speaking/vstep-history', [SpeakingPracticeController::class, 'vstepHistory']);
        Route::post('/practice/speaking/drill-sessions', [SpeakingPracticeController::class, 'startDrillSession']);
        Route::post('/practice/speaking/vstep-sessions', [SpeakingPracticeController::class, 'startVstepSession']);
        Route::post('/practice/speaking/drill-sessions/{practice_session}/attempt', [SpeakingPracticeController::class, 'drillAttempt']);
        Route::post('/practice/speaking/vstep-sessions/{practice_session}/submit', [SpeakingPracticeController::class, 'submitVstep']);

        // Practice Speaking — conversation roleplay.
        Route::get('/practice/speaking/scenarios', [SpeakingConversationController::class, 'listScenarios']);
        Route::get('/practice/speaking/scenarios/{id}', [SpeakingConversationController::class, 'showScenario']);
        Route::middleware('ai-circuit-breaker')->group(function () {
            Route::post('/practice/speaking/conversations', [SpeakingConversationController::class, 'start']);
            Route::get('/practice/speaking/conversations/history', [SpeakingConversationController::class, 'history']);
            Route::get('/practice/speaking/conversations/{conversation_session}', [SpeakingConversationController::class, 'show']);
            Route::post('/practice/speaking/conversations/{conversation_session}/turn', [SpeakingConversationController::class, 'submitTurn']);
            Route::post('/practice/speaking/conversations/{conversation_session}/end', [SpeakingConversationController::class, 'end']);
            Route::get('/practice/speaking/conversations/{conversation_session}/review', [SpeakingConversationController::class, 'review']);
        });
        Route::post('/practice/speaking/pronunciation-review', [SpeakingConversationController::class, 'pronunciationReview'])
            ->middleware('throttle:'.config('practice.rate_limits.pronunciation_review'))
            ->middleware('ai-circuit-breaker');

        // Practice Speaking — shadowing progress.
        Route::get('/practice/speaking/shadowing/progress', [ShadowingProgressController::class, 'index']);
        Route::post('/practice/speaking/shadowing/progress', [ShadowingProgressController::class, 'store']);

        // Exams (mock test).
        Route::get('/exams', [ExamController::class, 'index']);
        Route::get('/exams/{id}', [ExamController::class, 'show']);
        Route::post('/exams/{examId}/sessions', [ExamController::class, 'startSession']);
        Route::get('/exam-sessions/active', [ExamController::class, 'activeSession']);
        Route::get('/exam-sessions', [ExamController::class, 'mySessions']);
        Route::get('/exam-sessions/{exam_session}', [ExamController::class, 'showSession']);
        Route::get('/exam-sessions/{exam_session}/results', [ExamController::class, 'sessionResults']);
        Route::post('/exam-sessions/{exam_session}/submit', [ExamController::class, 'submit']);
        Route::post('/exam-sessions/{exam_session}/abandon', [ExamController::class, 'abandon']);
        Route::get('/exam-sessions/{exam_session}/draft', [ExamController::class, 'getDraft']);
        Route::put('/exam-sessions/{exam_session}/draft', [ExamController::class, 'saveDraft'])
            ->middleware('throttle:120,1');
        Route::post('/exam-sessions/{exam_session}/listening-played', [ExamController::class, 'logListeningPlayed']);
        Route::get('/exam-sessions/{exam_session}/listening-played', [ExamController::class, 'listeningPlaySummary']);
        Route::get('/exam-sessions/{exam_session}/writing-results', [ExamController::class, 'writingResults']);
        Route::get('/exam-sessions/{exam_session}/speaking-results', [ExamController::class, 'speakingResults']);

        // Grading.
        Route::get('/grading/jobs/{grading_job}', [GradingController::class, 'showJob']);
        Route::get('/grading/jobs/{grading_job}/status', [GradingController::class, 'jobStatus']);
        Route::get('/grading/writing/{submissionType}/{submissionId}', [GradingController::class, 'writingResult'])
            ->whereIn('submissionType', ['practice_writing', 'exam_writing'])
            ->whereUuid('submissionId');
        Route::get('/grading/speaking/{submissionType}/{submissionId}', [GradingController::class, 'speakingResult'])
            ->whereIn('submissionType', ['practice_speaking', 'exam_speaking'])
            ->whereUuid('submissionId');

        // Audio presigned URLs (R2).
        Route::post('/audio/presign-upload', [AudioController::class, 'presignUpload']);
        Route::post('/audio/presign-download', [AudioController::class, 'presignDownload']);

        // Overview & progress.
        Route::get('/overview', [OverviewController::class, 'overview']);
        Route::get('/streak', [OverviewController::class, 'streak']);
        Route::post('/streak/milestones/{days}/claim', [OverviewController::class, 'claimStreakMilestone'])
            ->whereNumber('days');
        Route::get('/activity-heatmap', [OverviewController::class, 'activityHeatmap']);

        // Courses.
        Route::get('/courses', [CourseController::class, 'index']);
        Route::get('/courses/{course}', [CourseController::class, 'show']);
        Route::post('/courses/{course}/enrollment-orders', [CourseController::class, 'createEnrollmentOrder']);
        Route::get('/courses/enrollment-orders', [CourseController::class, 'enrollmentOrders']);
        Route::post('/courses/enrollment-orders/{enrollment_order}/confirm', [CourseController::class, 'confirmEnrollmentOrder']);
        Route::get('/courses/{course}/bookings', [CourseController::class, 'bookings']);
        Route::post('/courses/{course}/bookings', [CourseController::class, 'bookSlot']);

        // Notifications.
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'read']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
    });

    // Admin/Staff routes (role >= staff)
    Route::middleware(['auth:api', 'role:staff'])->prefix('admin')->group(function () {
        Route::get('/stats', [Admin\DashboardController::class, 'stats']);
        Route::get('/alerts', [Admin\DashboardController::class, 'alerts']);
        Route::get('/action-items', [Admin\DashboardController::class, 'actionItems']);
        Route::get('/content-status', [Admin\DashboardController::class, 'contentStatus']);
        Route::get('/recent-activity', [Admin\DashboardController::class, 'recentActivity']);

        // Audio upload (presigned PUT to R2) — staff only.
        Route::post('/audio/presign-upload', [Admin\AudioUploadController::class, 'presignUpload']);

        // Top-up packages CRUD (Plans tab).
        Route::prefix('topup-packages')->group(function () {
            Route::get('/', [Admin\TopupPackageController::class, 'index']);
            Route::post('/', [Admin\TopupPackageController::class, 'store']);
            Route::get('/{id}', [Admin\TopupPackageController::class, 'show']);
            Route::patch('/{id}', [Admin\TopupPackageController::class, 'update']);
            Route::delete('/{id}', [Admin\TopupPackageController::class, 'destroy']);
            Route::post('/{id}/activate', [Admin\TopupPackageController::class, 'activate']);
            Route::post('/{id}/deactivate', [Admin\TopupPackageController::class, 'deactivate']);
        });

        // System config — ADMIN ONLY (nested middleware role:admin overrides parent role:staff)
        Route::middleware('role:admin')->prefix('system-config')->group(function () {
            Route::get('/', [Admin\SystemConfigController::class, 'index']);
            Route::get('/{key}', [Admin\SystemConfigController::class, 'show'])->where('key', '[a-zA-Z0-9._-]+');
            Route::patch('/{key}', [Admin\SystemConfigController::class, 'update'])->where('key', '[a-zA-Z0-9._-]+');
        });

        // Analytics — finance, growth, activity, distribution
        Route::prefix('analytics')->group(function () {
            Route::get('/revenue-overview', [Admin\AnalyticsController::class, 'revenueOverview']);
            Route::get('/revenue-trend', [Admin\AnalyticsController::class, 'revenueTrend']);
            Route::get('/user-growth', [Admin\AnalyticsController::class, 'userGrowth']);
            Route::get('/wallet-economy', [Admin\AnalyticsController::class, 'walletEconomy']);
            Route::get('/practice-activity', [Admin\AnalyticsController::class, 'practiceActivity']);
            Route::get('/grading-throughput', [Admin\AnalyticsController::class, 'gradingThroughput']);
            Route::get('/profile-segments', [Admin\AnalyticsController::class, 'profileSegments']);
            Route::get('/streak-distribution', [Admin\AnalyticsController::class, 'streakDistribution']);
            Route::get('/promo-stats', [Admin\AnalyticsController::class, 'promoStats']);
            Route::get('/top-content', [Admin\AnalyticsController::class, 'topContent']);
        });

        // Exam management
        Route::prefix('exams')->group(function () {
            Route::post('/import', [Admin\ExamController::class, 'import']);
            Route::get('/', [Admin\ExamController::class, 'index']);
            Route::post('/', [Admin\ExamController::class, 'store']);
            Route::get('/{id}', [Admin\ExamController::class, 'show'])->whereUuid('id');
            Route::patch('/{id}', [Admin\ExamController::class, 'update'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamController::class, 'destroy'])->whereUuid('id');
            Route::post('/{id}/publish', [Admin\ExamController::class, 'publish'])->whereUuid('id');
            Route::post('/{id}/unpublish', [Admin\ExamController::class, 'unpublish'])->whereUuid('id');

            // Version management
            Route::get('/{examId}/versions', [Admin\ExamVersionController::class, 'index'])->whereUuid('examId');
            Route::post('/{examId}/versions', [Admin\ExamVersionController::class, 'store'])->whereUuid('examId');
            Route::get('/{examId}/versions/{versionId}', [Admin\ExamVersionController::class, 'show'])->whereUuid(['examId', 'versionId']);
            Route::post('/{examId}/versions/{versionId}/activate', [Admin\ExamVersionController::class, 'setActive'])->whereUuid(['examId', 'versionId']);
            Route::delete('/{examId}/versions/{versionId}', [Admin\ExamVersionController::class, 'destroy'])->whereUuid(['examId', 'versionId']);
        });

        // Exam content CRUD (child resources of version)
        Route::prefix('exams/versions/{versionId}')->whereUuid('versionId')->group(function () {
            Route::post('/listening-sections', [Admin\ExamContentController::class, 'storeListeningSection']);
            Route::post('/reading-passages', [Admin\ExamContentController::class, 'storeReadingPassage']);
            Route::post('/writing-tasks', [Admin\ExamContentController::class, 'storeWritingTask']);
            Route::post('/speaking-parts', [Admin\ExamContentController::class, 'storeSpeakingPart']);
        });
        Route::prefix('exams/listening-sections')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateListeningSection'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroyListeningSection'])->whereUuid('id');
            Route::post('/{id}/items', [Admin\ExamContentController::class, 'storeListeningItem'])->whereUuid('id');
        });
        Route::prefix('exams/listening-items')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateListeningItem'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroyListeningItem'])->whereUuid('id');
        });
        Route::prefix('exams/reading-passages')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateReadingPassage'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroyReadingPassage'])->whereUuid('id');
            Route::post('/{id}/items', [Admin\ExamContentController::class, 'storeReadingItem'])->whereUuid('id');
        });
        Route::prefix('exams/reading-items')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateReadingItem'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroyReadingItem'])->whereUuid('id');
        });
        Route::prefix('exams/writing-tasks')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateWritingTask'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroyWritingTask'])->whereUuid('id');
        });
        Route::prefix('exams/speaking-parts')->group(function () {
            Route::patch('/{id}', [Admin\ExamContentController::class, 'updateSpeakingPart'])->whereUuid('id');
            Route::delete('/{id}', [Admin\ExamContentController::class, 'destroySpeakingPart'])->whereUuid('id');
        });

        // Vocab management — Topics + Words + Exercises
        Route::prefix('vocab')->group(function () {
            Route::get('/topics', [Admin\VocabController::class, 'indexTopics']);
            Route::post('/topics', [Admin\VocabController::class, 'storeTopic']);
            Route::get('/topics/{id}', [Admin\VocabController::class, 'showTopic'])->whereUuid('id');
            Route::patch('/topics/{id}', [Admin\VocabController::class, 'updateTopic'])->whereUuid('id');
            Route::delete('/topics/{id}', [Admin\VocabController::class, 'destroyTopic'])->whereUuid('id');
            Route::post('/topics/{id}/publish', [Admin\VocabController::class, 'publishTopic'])->whereUuid('id');
            Route::post('/topics/{id}/unpublish', [Admin\VocabController::class, 'unpublishTopic'])->whereUuid('id');

            Route::get('/topics/{id}/words', [Admin\VocabController::class, 'indexWords'])->whereUuid('id');
            Route::post('/topics/{id}/words', [Admin\VocabController::class, 'storeWord'])->whereUuid('id');
            Route::post('/topics/{id}/words/reorder', [Admin\VocabController::class, 'reorderWords'])->whereUuid('id');
            Route::patch('/words/{wordId}', [Admin\VocabController::class, 'updateWord'])->whereUuid('wordId');
            Route::delete('/words/{wordId}', [Admin\VocabController::class, 'destroyWord'])->whereUuid('wordId');

            Route::get('/topics/{id}/exercises', [Admin\VocabController::class, 'indexExercises'])->whereUuid('id');
            Route::post('/topics/{id}/exercises', [Admin\VocabController::class, 'storeExercise'])->whereUuid('id');
            Route::post('/topics/{id}/exercises/reorder', [Admin\VocabController::class, 'reorderExercises'])->whereUuid('id');
            Route::patch('/exercises/{exerciseId}', [Admin\VocabController::class, 'updateExercise'])->whereUuid('exerciseId');
            Route::delete('/exercises/{exerciseId}', [Admin\VocabController::class, 'destroyExercise'])->whereUuid('exerciseId');
        });

        // Grammar management — Points + 4 children + Exercises
        Route::prefix('grammar')->group(function () {
            Route::get('/points', [Admin\GrammarController::class, 'indexPoints']);
            Route::post('/points', [Admin\GrammarController::class, 'storePoint']);
            Route::get('/points/{id}', [Admin\GrammarController::class, 'showPoint'])->whereUuid('id');
            Route::patch('/points/{id}', [Admin\GrammarController::class, 'updatePoint'])->whereUuid('id');
            Route::delete('/points/{id}', [Admin\GrammarController::class, 'destroyPoint'])->whereUuid('id');
            Route::post('/points/{id}/publish', [Admin\GrammarController::class, 'publishPoint'])->whereUuid('id');
            Route::post('/points/{id}/unpublish', [Admin\GrammarController::class, 'unpublishPoint'])->whereUuid('id');

            Route::get('/points/{id}/structures', [Admin\GrammarController::class, 'indexStructures'])->whereUuid('id');
            Route::post('/points/{id}/structures', [Admin\GrammarController::class, 'storeStructure'])->whereUuid('id');
            Route::post('/points/{id}/structures/reorder', [Admin\GrammarController::class, 'reorderStructures'])->whereUuid('id');
            Route::patch('/structures/{childId}', [Admin\GrammarController::class, 'updateStructure'])->whereUuid('childId');
            Route::delete('/structures/{childId}', [Admin\GrammarController::class, 'destroyStructure'])->whereUuid('childId');

            Route::get('/points/{id}/examples', [Admin\GrammarController::class, 'indexExamples'])->whereUuid('id');
            Route::post('/points/{id}/examples', [Admin\GrammarController::class, 'storeExample'])->whereUuid('id');
            Route::post('/points/{id}/examples/reorder', [Admin\GrammarController::class, 'reorderExamples'])->whereUuid('id');
            Route::patch('/examples/{childId}', [Admin\GrammarController::class, 'updateExample'])->whereUuid('childId');
            Route::delete('/examples/{childId}', [Admin\GrammarController::class, 'destroyExample'])->whereUuid('childId');

            Route::get('/points/{id}/mistakes', [Admin\GrammarController::class, 'indexMistakes'])->whereUuid('id');
            Route::post('/points/{id}/mistakes', [Admin\GrammarController::class, 'storeMistake'])->whereUuid('id');
            Route::post('/points/{id}/mistakes/reorder', [Admin\GrammarController::class, 'reorderMistakes'])->whereUuid('id');
            Route::patch('/mistakes/{childId}', [Admin\GrammarController::class, 'updateMistake'])->whereUuid('childId');
            Route::delete('/mistakes/{childId}', [Admin\GrammarController::class, 'destroyMistake'])->whereUuid('childId');

            Route::get('/points/{id}/tips', [Admin\GrammarController::class, 'indexTips'])->whereUuid('id');
            Route::post('/points/{id}/tips', [Admin\GrammarController::class, 'storeTip'])->whereUuid('id');
            Route::post('/points/{id}/tips/reorder', [Admin\GrammarController::class, 'reorderTips'])->whereUuid('id');
            Route::patch('/tips/{childId}', [Admin\GrammarController::class, 'updateTip'])->whereUuid('childId');
            Route::delete('/tips/{childId}', [Admin\GrammarController::class, 'destroyTip'])->whereUuid('childId');

            Route::get('/points/{id}/exercises', [Admin\GrammarController::class, 'indexExercises'])->whereUuid('id');
            Route::post('/points/{id}/exercises', [Admin\GrammarController::class, 'storeExercise'])->whereUuid('id');
            Route::post('/points/{id}/exercises/reorder', [Admin\GrammarController::class, 'reorderExercises'])->whereUuid('id');
            Route::patch('/exercises/{childId}', [Admin\GrammarController::class, 'updateExercise'])->whereUuid('childId');
            Route::delete('/exercises/{childId}', [Admin\GrammarController::class, 'destroyExercise'])->whereUuid('childId');
        });

        // Practice Listening
        Route::prefix('practice/listening')->group(function () {
            Route::get('/exercises', [Admin\ListeningController::class, 'indexExercises']);
            Route::post('/exercises', [Admin\ListeningController::class, 'storeExercise']);
            Route::get('/exercises/{id}', [Admin\ListeningController::class, 'showExercise'])->whereUuid('id');
            Route::patch('/exercises/{id}', [Admin\ListeningController::class, 'updateExercise'])->whereUuid('id');
            Route::delete('/exercises/{id}', [Admin\ListeningController::class, 'destroyExercise'])->whereUuid('id');
            Route::post('/exercises/{id}/publish', [Admin\ListeningController::class, 'publishExercise'])->whereUuid('id');
            Route::post('/exercises/{id}/unpublish', [Admin\ListeningController::class, 'unpublishExercise'])->whereUuid('id');

            Route::get('/exercises/{id}/questions', [Admin\ListeningController::class, 'indexQuestions'])->whereUuid('id');
            Route::post('/exercises/{id}/questions', [Admin\ListeningController::class, 'storeQuestion'])->whereUuid('id');
            Route::post('/exercises/{id}/questions/reorder', [Admin\ListeningController::class, 'reorderQuestions'])->whereUuid('id');
            Route::patch('/questions/{questionId}', [Admin\ListeningController::class, 'updateQuestion'])->whereUuid('questionId');
            Route::delete('/questions/{questionId}', [Admin\ListeningController::class, 'destroyQuestion'])->whereUuid('questionId');
        });

        // Practice Reading
        Route::prefix('practice/reading')->group(function () {
            Route::get('/exercises', [Admin\ReadingController::class, 'indexExercises']);
            Route::post('/exercises', [Admin\ReadingController::class, 'storeExercise']);
            Route::get('/exercises/{id}', [Admin\ReadingController::class, 'showExercise'])->whereUuid('id');
            Route::patch('/exercises/{id}', [Admin\ReadingController::class, 'updateExercise'])->whereUuid('id');
            Route::delete('/exercises/{id}', [Admin\ReadingController::class, 'destroyExercise'])->whereUuid('id');
            Route::post('/exercises/{id}/publish', [Admin\ReadingController::class, 'publishExercise'])->whereUuid('id');
            Route::post('/exercises/{id}/unpublish', [Admin\ReadingController::class, 'unpublishExercise'])->whereUuid('id');

            Route::get('/exercises/{id}/questions', [Admin\ReadingController::class, 'indexQuestions'])->whereUuid('id');
            Route::post('/exercises/{id}/questions', [Admin\ReadingController::class, 'storeQuestion'])->whereUuid('id');
            Route::post('/exercises/{id}/questions/reorder', [Admin\ReadingController::class, 'reorderQuestions'])->whereUuid('id');
            Route::patch('/questions/{questionId}', [Admin\ReadingController::class, 'updateQuestion'])->whereUuid('questionId');
            Route::delete('/questions/{questionId}', [Admin\ReadingController::class, 'destroyQuestion'])->whereUuid('questionId');
        });

        // Practice Writing — prompts + sample markers
        Route::prefix('practice/writing')->group(function () {
            Route::get('/prompts', [Admin\WritingController::class, 'indexPrompts']);
            Route::post('/prompts', [Admin\WritingController::class, 'storePrompt']);
            Route::get('/prompts/{id}', [Admin\WritingController::class, 'showPrompt'])->whereUuid('id');
            Route::patch('/prompts/{id}', [Admin\WritingController::class, 'updatePrompt'])->whereUuid('id');
            Route::delete('/prompts/{id}', [Admin\WritingController::class, 'destroyPrompt'])->whereUuid('id');
            Route::post('/prompts/{id}/publish', [Admin\WritingController::class, 'publishPrompt'])->whereUuid('id');
            Route::post('/prompts/{id}/unpublish', [Admin\WritingController::class, 'unpublishPrompt'])->whereUuid('id');

            Route::get('/prompts/{id}/markers', [Admin\WritingController::class, 'indexMarkers'])->whereUuid('id');
            Route::post('/prompts/{id}/markers', [Admin\WritingController::class, 'storeMarker'])->whereUuid('id');
            Route::patch('/markers/{markerId}', [Admin\WritingController::class, 'updateMarker'])->whereUuid('markerId');
            Route::delete('/markers/{markerId}', [Admin\WritingController::class, 'destroyMarker'])->whereUuid('markerId');
        });

        // Practice Speaking — Drills (phát âm)
        Route::prefix('practice/speaking-drills')->group(function () {
            Route::get('/', [Admin\SpeakingDrillController::class, 'indexDrills']);
            Route::post('/', [Admin\SpeakingDrillController::class, 'storeDrill']);
            Route::get('/{id}', [Admin\SpeakingDrillController::class, 'showDrill'])->whereUuid('id');
            Route::patch('/{id}', [Admin\SpeakingDrillController::class, 'updateDrill'])->whereUuid('id');
            Route::delete('/{id}', [Admin\SpeakingDrillController::class, 'destroyDrill'])->whereUuid('id');
            Route::post('/{id}/publish', [Admin\SpeakingDrillController::class, 'publishDrill'])->whereUuid('id');
            Route::post('/{id}/unpublish', [Admin\SpeakingDrillController::class, 'unpublishDrill'])->whereUuid('id');

            Route::get('/{id}/sentences', [Admin\SpeakingDrillController::class, 'indexSentences'])->whereUuid('id');
            Route::post('/{id}/sentences', [Admin\SpeakingDrillController::class, 'storeSentence'])->whereUuid('id');
        });
        Route::patch('/practice/speaking-drill-sentences/{sentenceId}', [Admin\SpeakingDrillController::class, 'updateSentence'])->whereUuid('sentenceId');
        Route::delete('/practice/speaking-drill-sentences/{sentenceId}', [Admin\SpeakingDrillController::class, 'destroySentence'])->whereUuid('sentenceId');

        // Users — picker endpoints (read-only) còn dùng cho staff.
        Route::get('/users/teachers', [Admin\UserController::class, 'teachers']);
        Route::get('/profiles/search', [Admin\UserController::class, 'searchProfiles']);

        // Promo codes — ADMIN ONLY. Không hard delete; disable qua is_active.
        Route::middleware('role:admin')->prefix('promo-codes')->group(function () {
            Route::get('/', [Admin\PromoCodeController::class, 'index']);
            Route::post('/', [Admin\PromoCodeController::class, 'store']);
            Route::post('/generate-code', [Admin\PromoCodeController::class, 'generateCode']);
            Route::get('/{id}', [Admin\PromoCodeController::class, 'show'])->whereUuid('id');
            Route::patch('/{id}', [Admin\PromoCodeController::class, 'update'])->whereUuid('id');
        });

        // User management — ADMIN ONLY (nested middleware override role:staff parent).
        // Soft deactivate, không hard delete. Role chỉ set lúc create.
        Route::middleware('role:admin')->prefix('users')->group(function () {
            Route::get('/', [Admin\UserController::class, 'index']);
            Route::post('/', [Admin\UserController::class, 'store']);
            Route::get('/{id}', [Admin\UserController::class, 'show'])->whereUuid('id');
            Route::patch('/{id}', [Admin\UserController::class, 'update'])->whereUuid('id');
            Route::post('/{id}/deactivate', [Admin\UserController::class, 'deactivate'])->whereUuid('id');
            Route::post('/{id}/activate', [Admin\UserController::class, 'activate'])->whereUuid('id');
            Route::post('/{id}/reset-password', [Admin\UserController::class, 'resetPassword'])->whereUuid('id');
            Route::get('/{id}/teacher-active-courses', [Admin\UserController::class, 'teacherActiveCourses'])->whereUuid('id');
        });

        // Courses — quản lý khóa học (gán teacher, schedule, pricing)
        Route::prefix('courses')->group(function () {
            Route::get('/', [Admin\CourseController::class, 'index']);
            Route::post('/', [Admin\CourseController::class, 'store']);
            Route::get('/{id}', [Admin\CourseController::class, 'show'])->whereUuid('id');
            Route::patch('/{id}', [Admin\CourseController::class, 'update'])->whereUuid('id');
            Route::delete('/{id}', [Admin\CourseController::class, 'destroy'])->whereUuid('id');
            Route::post('/{id}/publish', [Admin\CourseController::class, 'publish'])->whereUuid('id');
            Route::post('/{id}/unpublish', [Admin\CourseController::class, 'unpublish'])->whereUuid('id');

            // Schedule items — buổi học chung của khóa
            Route::get('/{id}/schedule-items', [Admin\CourseController::class, 'indexScheduleItems'])->whereUuid('id');
            Route::post('/{id}/schedule-items', [Admin\CourseController::class, 'storeScheduleItem'])->whereUuid('id');

            // Enrollments — danh sách học viên đã ghi danh + thêm thủ công
            Route::get('/{id}/enrollments', [Admin\CourseController::class, 'indexEnrollments'])->whereUuid('id');
            Route::post('/{id}/enrollments', [Admin\CourseController::class, 'storeEnrollment'])->whereUuid('id');

            // Teacher slots — lịch rảnh 1-1 (admin sắp xếp)
            Route::get('/{id}/slots', [Admin\CourseController::class, 'indexSlots'])->whereUuid('id');
            Route::post('/{id}/slots', [Admin\CourseController::class, 'storeSlot'])->whereUuid('id');
            Route::post('/{id}/slots/bulk', [Admin\CourseController::class, 'bulkStoreSlots'])->whereUuid('id');

            // Bookings — học viên đã đặt slot (admin sửa meet_url + cancel + refund)
            Route::get('/{id}/bookings', [Admin\CourseController::class, 'indexBookings'])->whereUuid('id');
        });
        Route::patch('/schedule-items/{itemId}', [Admin\CourseController::class, 'updateScheduleItem'])->whereUuid('itemId');
        Route::delete('/schedule-items/{itemId}', [Admin\CourseController::class, 'destroyScheduleItem'])->whereUuid('itemId');

        // Slot management (admin sửa/xóa slot khi chưa có booking)
        Route::patch('/slots/{slotId}', [Admin\CourseController::class, 'updateSlot'])->whereUuid('slotId');
        Route::delete('/slots/{slotId}', [Admin\CourseController::class, 'destroySlot'])->whereUuid('slotId');

        // Booking management (admin sửa meet_url + cancel kèm refund)
        Route::patch('/bookings/{bookingId}', [Admin\CourseController::class, 'updateBooking'])->whereUuid('bookingId');
        Route::post('/bookings/{bookingId}/cancel', [Admin\CourseController::class, 'cancelBooking'])->whereUuid('bookingId');

        // Enrollment management (admin can unenroll + override commitment)
        Route::patch('/enrollments/{enrollmentId}/commitment', [Admin\CourseController::class, 'setEnrollmentCommitment'])->whereUuid('enrollmentId');
        Route::delete('/enrollments/{enrollmentId}', [Admin\CourseController::class, 'destroyEnrollment'])->whereUuid('enrollmentId');

        // Practice Speaking — Tasks (VSTEP)
        Route::prefix('practice/speaking-tasks')->group(function () {
            Route::get('/', [Admin\SpeakingTaskController::class, 'indexTasks']);
            Route::post('/', [Admin\SpeakingTaskController::class, 'storeTask']);
            Route::get('/{id}', [Admin\SpeakingTaskController::class, 'showTask'])->whereUuid('id');
            Route::patch('/{id}', [Admin\SpeakingTaskController::class, 'updateTask'])->whereUuid('id');
            Route::delete('/{id}', [Admin\SpeakingTaskController::class, 'destroyTask'])->whereUuid('id');
            Route::post('/{id}/publish', [Admin\SpeakingTaskController::class, 'publishTask'])->whereUuid('id');
            Route::post('/{id}/unpublish', [Admin\SpeakingTaskController::class, 'unpublishTask'])->whereUuid('id');
        });

        // Practice Speaking — Scenarios (Hội thoại AI)
        Route::prefix('practice/speaking-scenarios')->group(function () {
            Route::get('/', [Admin\SpeakingScenarioController::class, 'index']);
            Route::post('/', [Admin\SpeakingScenarioController::class, 'store']);
            Route::get('/{id}', [Admin\SpeakingScenarioController::class, 'show'])->whereUuid('id');
            Route::patch('/{id}', [Admin\SpeakingScenarioController::class, 'update'])->whereUuid('id');
            Route::delete('/{id}', [Admin\SpeakingScenarioController::class, 'destroy'])->whereUuid('id');
            Route::post('/{id}/publish', [Admin\SpeakingScenarioController::class, 'publish'])->whereUuid('id');
            Route::post('/{id}/unpublish', [Admin\SpeakingScenarioController::class, 'unpublish'])->whereUuid('id');
        });
    });
});
