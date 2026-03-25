<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DeviceController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\KnowledgePointController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\PracticeController;
use App\Http\Controllers\Api\V1\ProgressController;
use App\Http\Controllers\Api\V1\QuestionController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VocabularyController;
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

    // Auth (public, rate limited)
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    });

    // Protected
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Knowledge Points (admin)
        Route::middleware('role:admin')->group(function () {
            Route::get('/knowledge-points/topics', [KnowledgePointController::class, 'topics']);
            Route::apiResource('knowledge-points', KnowledgePointController::class);
        });

        // Questions (admin)
        Route::middleware('role:admin')->group(function () {
            Route::apiResource('questions', QuestionController::class);
        });

        // Exams
        Route::get('/exams', [ExamController::class, 'index']);
        Route::get('/exams/{exam}', [ExamController::class, 'show']);
        Route::post('/exams/{exam}/start', [ExamController::class, 'start']);
        Route::middleware('role:admin')->group(function () {
            Route::post('/exams', [ExamController::class, 'store']);
            Route::patch('/exams/{exam}', [ExamController::class, 'update']);
        });

        // Sessions
        Route::get('/sessions', [SessionController::class, 'index']);
        Route::get('/sessions/{session}', [SessionController::class, 'show']);
        Route::put('/sessions/{session}', [SessionController::class, 'saveAnswers']);
        Route::post('/sessions/{session}/answer', [SessionController::class, 'answer']);
        Route::post('/sessions/{session}/submit', [SessionController::class, 'submit']);

        // Submissions
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);
        Route::middleware('role:admin')->group(function () {
            Route::post('/submissions/{submission}/grade', [SubmissionController::class, 'grade']);
        });

        // Progress
        Route::get('/progress', [ProgressController::class, 'index']);
        Route::get('/progress/spider-chart', [ProgressController::class, 'spiderChart']);
        Route::get('/progress/activity', [ProgressController::class, 'activity']);
        Route::get('/progress/learning-path', [ProgressController::class, 'learningPath']);
        Route::get('/progress/{skill}', [ProgressController::class, 'bySkill'])
            ->where('skill', 'listening|reading|writing|speaking');
        Route::post('/progress/goals', [ProgressController::class, 'storeGoal']);
        Route::patch('/progress/goals/{goal}', [ProgressController::class, 'updateGoal']);
        Route::delete('/progress/goals/{goal}', [ProgressController::class, 'destroyGoal']);

        // Vocabulary
        Route::get('/vocabulary/topics', [VocabularyController::class, 'topics']);
        Route::get('/vocabulary/topics/{topic}', [VocabularyController::class, 'showTopic']);
        Route::get('/vocabulary/topics/{topic}/progress', [VocabularyController::class, 'topicProgress']);
        Route::put('/vocabulary/words/{word}/known', [VocabularyController::class, 'toggleKnown']);

        // Users
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::post('/users/{user}/password', [UserController::class, 'changePassword']);
        Route::post('/users/{user}/avatar', [UserController::class, 'uploadAvatar']);

        // Onboarding
        Route::get('/onboarding/status', [OnboardingController::class, 'status']);
        Route::post('/onboarding/self-assess', [OnboardingController::class, 'selfAssess']);
        Route::post('/onboarding/placement', [OnboardingController::class, 'placement']);
        Route::post('/onboarding/sessions/{session}/complete-placement', [OnboardingController::class, 'completePlacement']);
        Route::post('/onboarding/skip', [OnboardingController::class, 'skip']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        // Practice (adaptive)
        Route::get('/practice/next', [PracticeController::class, 'next']);
        Route::post('/practice/{question}/submit', [PracticeController::class, 'submit']);

        // Devices
        Route::post('/devices', [DeviceController::class, 'store']);
        Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);
    });
});
