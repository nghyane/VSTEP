<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wallet\CreateTopupOrderRequest;
use App\Http\Requests\Wallet\PromoRedeemRequest;
use App\Http\Resources\CoinTransactionResource;
use App\Http\Resources\WalletTopupOrderResource;
use App\Http\Resources\WalletTopupPackageResource;
use App\Models\CoinTransaction;
use App\Models\Profile;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use App\Services\PromoService;
use App\Services\TopupService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Wallet endpoints cho active profile.
 * Route group mount middleware `active-profile` → guarantee $profile hiện diện.
 */
class WalletController extends Controller
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly PromoService $promoService,
        private readonly TopupService $topupService,
    ) {}

    public function balance(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        $balance = $this->walletService->getBalance($profile);
        $last = CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->orderByDesc('id')
            ->first();

        return response()->json(['data' => [
            'balance' => $balance,
            'last_transaction_at' => $last?->created_at,
        ]]);
    }

    public function transactions(Request $request): AnonymousResourceCollection
    {
        $profile = $this->profile($request);
        $perPage = min((int) $request->integer('per_page', 20), 100);

        $page = CoinTransaction::query()
            ->where('profile_id', $profile->id)
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
        $profile = $this->profile($request);
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($request->validated('package_id'));

        $order = $this->topupService->createOrder(
            $profile,
            $package,
            $request->validated('payment_provider', 'mock'),
        );

        return response()->json([
            'data' => new WalletTopupOrderResource($order),
        ], 201);
    }

    /**
     * Mock confirm endpoint. Real gateway sẽ dùng webhook riêng.
     */
    public function confirmTopup(Request $request, string $orderId): JsonResponse
    {
        $profile = $this->profile($request);
        /** @var WalletTopupOrder $order */
        $order = WalletTopupOrder::query()->findOrFail($orderId);

        if ($order->profile_id !== $profile->id) {
            abort(403, 'Order does not belong to active profile.');
        }

        $confirmed = $this->topupService->confirm($order);

        return response()->json([
            'data' => new WalletTopupOrderResource($confirmed),
        ]);
    }

    public function redeemPromo(PromoRedeemRequest $request): JsonResponse
    {
        $profile = $this->profile($request);
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

    private function profile(Request $request): Profile
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('active_profile');

        return $profile;
    }
}
