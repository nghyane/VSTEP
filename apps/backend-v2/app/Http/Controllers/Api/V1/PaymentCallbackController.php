<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentProvider;
use App\Http\Controllers\Controller;
use App\Services\TopupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles payment gateway callbacks (webhook/IPN).
 *
 * NO AUTH — gateways call this server-to-server.
 * Route: POST /api/v1/payment/callback/{provider}
 */
final class PaymentCallbackController extends Controller
{
    public function handle(string $provider, Request $request, TopupService $topup): JsonResponse
    {
        $paymentProvider = PaymentProvider::tryFrom($provider);
        if ($paymentProvider === null) {
            Log::warning('Payment callback: unknown provider', ['provider' => $provider]);

            return response()->json(['success' => false, 'message' => 'Unknown provider'], 400);
        }

        try {
            $topup->handleCallback($paymentProvider, $request->all());

            return response()->json(['success' => true]);
        } catch (\RuntimeException $e) {
            Log::error('Payment callback failed', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
