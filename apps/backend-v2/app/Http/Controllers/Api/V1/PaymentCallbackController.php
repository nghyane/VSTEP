<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentProvider;
use App\Http\Controllers\Controller;
use App\Models\CourseEnrollmentOrder;
use App\Models\WalletTopupOrder;
use App\Services\CourseOrderService;
use App\Services\Payment\OrderNotFoundAfterValidation;
use App\Services\Payment\PaymentGatewayRegistry;
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
    public function handle(
        string $provider,
        Request $request,
        PaymentGatewayRegistry $gateways,
        TopupService $topup,
        CourseOrderService $courseOrders,
    ): JsonResponse {
        $paymentProvider = PaymentProvider::tryFrom($provider);
        if ($paymentProvider === null) {
            Log::warning('Payment callback: unknown provider', ['provider' => $provider]);

            return response()->json(['success' => false, 'message' => 'Unknown provider'], 400);
        }

        try {
            $result = $gateways->get($paymentProvider)->validateCallback($request->all());

            if (! $result->success) {
                $this->markFailedOrder($result->orderCode, $paymentProvider, $topup, $courseOrders, $request->all());

                return response()->json(['success' => false, 'message' => $result->failureReason], 400);
            }

            if (WalletTopupOrder::query()->where('order_code', $result->orderCode)->exists()) {
                $topup->confirmByOrderCode($result->orderCode, $result->gatewayTransactionId, $result->rawData);
            } elseif (CourseEnrollmentOrder::query()->where('order_code', $result->orderCode)->exists()) {
                $courseOrders->confirmByOrderCode($result->orderCode, $result->gatewayTransactionId, $result->rawData);
            } else {
                throw new OrderNotFoundAfterValidation($result->orderCode);
            }

            return response()->json(['success' => true]);
        } catch (OrderNotFoundAfterValidation $e) {
            // Signature valid but order not in DB yet (e.g. PayOS confirm-webhook test).
            // Return 200 so PayOS accepts the webhook URL.
            Log::info('Payment callback: valid signature, order not found', [
                'provider' => $provider,
                'order_code' => $e->orderCode,
            ]);

            return response()->json(['success' => true]);
        } catch (\RuntimeException $e) {
            Log::error('Payment callback failed', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    private function markFailedOrder(
        int $orderCode,
        PaymentProvider $paymentProvider,
        TopupService $topup,
        CourseOrderService $courseOrders,
        array $payload,
    ): void {
        if (WalletTopupOrder::query()->where('order_code', $orderCode)->exists()) {
            $topup->handleCallback($paymentProvider, $payload);
        } elseif (CourseEnrollmentOrder::query()->where('order_code', $orderCode)->exists()) {
            $courseOrders->handleCallback($paymentProvider, $payload);
        }
    }
}
