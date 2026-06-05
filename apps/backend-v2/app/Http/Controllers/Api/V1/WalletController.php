<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\PaymentProvider;
use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\CreateTopupOrderRequest;
use App\Http\Requests\Wallet\PromoRedeemRequest;
use App\Http\Resources\CoinTransactionResource;
use App\Http\Resources\WalletTopupOrderResource;
use App\Http\Resources\WalletTopupPackageResource;
use App\Models\CoinTransaction;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use App\Services\PromoService;
use App\Services\TopupService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Wallet endpoints cho account wallet, active profile chỉ là giao dịch context.
 * Route group mount middleware `active-profile` → guarantee $profile hiện diện.
 */
final class WalletController extends Controller
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly PromoService $promoService,
        private readonly TopupService $topupService,
    ) {}

    public function balance(Request $request): JsonResponse
    {
        $profile = $request->profile();
        $balance = $this->walletService->getBalance($profile);
        $last = CoinTransaction::query()
            ->where('account_id', $profile->account_id)
            ->orderByDesc('id')
            ->first();

        return response()->json(['data' => [
            'balance' => $balance,
            'last_transaction_at' => $last?->created_at,
        ]]);
    }

    public function transactions(Request $request): AnonymousResourceCollection
    {
        $profile = $request->profile();
        $perPage = min((int) $request->integer('per_page', 20), 100);

        $page = CoinTransaction::query()
            ->where('account_id', $profile->account_id)
            ->orderByDesc('id')
            ->paginate($perPage);

        return CoinTransactionResource::collection($page);
    }

    public function topupPackages(): AnonymousResourceCollection
    {
        $packages = WalletTopupPackage::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get();

        return WalletTopupPackageResource::collection($packages);
    }

    public function createTopup(CreateTopupOrderRequest $request): JsonResponse
    {
        $profile = $request->profile();
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($request->validated('package_id'));
        $provider = PaymentProvider::from($request->validated('payment_provider'));
        $returnUrl = $request->validated('return_url');

        [$order, $paymentUrl] = $this->topupService->createOrder($profile, $package, $provider, $returnUrl);

        return response()->json([
            'data' => new WalletTopupOrderResource($order),
        ], 201);
    }

    /**
     * Poll order status — for frontend to check after returning from gateway.
     */
    public function orderStatus(Request $request, WalletTopupOrder $order): JsonResponse
    {
        if ($order->account_id !== $request->user()->id) {
            abort(403, 'Order does not belong to this account.');
        }

        return response()->json([
            'data' => new WalletTopupOrderResource($order),
        ]);
    }

    public function redeemPromo(PromoRedeemRequest $request): JsonResponse
    {
        $profile = $request->profile();
        $redemption = $this->promoService->redeem(
            $request->user(),
            $profile,
            $request->validated('code'),
        );

        return response()->json(['data' => [
            'coins_granted' => $redemption->coins_granted,
            'balance_after' => $this->walletService->getBalance($profile),
            'transaction_id' => $redemption->coin_transaction_id,
            'redeemed_at' => $redemption->redeemed_at,
        ]]);
    }
}
