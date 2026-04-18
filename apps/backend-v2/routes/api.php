<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\VocabController;
use App\Http\Controllers\Api\V1\WalletController;
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

    // Auth (protected, no active profile required — admin/teacher fit here)
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/switch-profile', [AuthController::class, 'switchProfile']);
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
    });
});
