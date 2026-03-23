<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ExamController;
use App\Http\Controllers\Api\V1\KnowledgePointController;
use App\Http\Controllers\Api\V1\ProgressController;
use App\Http\Controllers\Api\V1\QuestionController;
use App\Http\Controllers\Api\V1\SubmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['status' => 'ok']));

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

        // Sessions (top-level resource, not nested under exams)
        Route::get('/sessions', [ExamController::class, 'sessions']);
        Route::get('/sessions/{session}', [ExamController::class, 'sessionDetail']);
        Route::put('/sessions/{session}', [ExamController::class, 'saveAnswers']);
        Route::post('/sessions/{session}/answer', [ExamController::class, 'answer']);
        Route::post('/sessions/{session}/submit', [ExamController::class, 'submit']);

        // Submissions
        Route::get('/submissions', [SubmissionController::class, 'index']);
        Route::get('/submissions/{submission}', [SubmissionController::class, 'show']);

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
    });
});
