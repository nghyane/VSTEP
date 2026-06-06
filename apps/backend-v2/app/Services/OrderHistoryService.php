<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Profile;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Facades\DB;

final class OrderHistoryService
{
    private const TYPE_TOPUP = 'topup';

    private const TYPE_COURSE = 'course';

    private const DEFAULT_PER_PAGE = 15;

    /** @param array<string, mixed> $filters */
    public function orders(User $account, Profile $profile, array $filters): LengthAwarePaginator
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = self::DEFAULT_PER_PAGE;
        $query = $this->topupOrderQuery($account)->unionAll($this->courseOrderQuery($profile));

        $base = DB::query()->fromSub($query, 'orders');
        $total = (clone $base)->count();
        $orders = $base
            ->orderByDesc('created_at')
            ->orderByDesc('order_code')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn (object $order): array => $this->orderRowFromQuery($order))
            ->values();

        return new Paginator($orders, $total, $perPage, $page);
    }

    private function topupOrderQuery(User $account): QueryBuilder
    {
        return DB::table('wallet_topup_orders as o')
            ->leftJoin('wallet_topup_packages as item', 'item.id', '=', 'o.package_id')
            ->where('o.account_id', $account->id)
            ->selectRaw("o.id, 'topup' as type, 'Nạp xu' as type_label, o.status, o.amount_vnd, o.payment_provider, o.order_code, COALESCE(item.label, 'Gói nạp đã xóa') as item_name, o.coins_to_credit, o.created_at");
    }

    private function courseOrderQuery(Profile $profile): QueryBuilder
    {
        return DB::table('course_enrollment_orders as o')
            ->leftJoin('courses as item', 'item.id', '=', 'o.course_id')
            ->where('o.profile_id', $profile->id)
            ->selectRaw("o.id, 'course' as type, 'Mua khóa học' as type_label, o.status, o.amount_vnd, o.payment_provider, o.order_code, COALESCE(item.title, 'Khóa học đã xóa') as item_name, NULL as coins_to_credit, o.created_at");
    }

    /** @return array<string, mixed> */
    private function orderRowFromQuery(object $order): array
    {
        $status = (string) $order->status;

        return [
            'id' => $order->id,
            'type' => $order->type,
            'type_label' => $order->type_label,
            'status' => $status,
            'amount_vnd' => (int) $order->amount_vnd,
            'payment_provider' => $order->payment_provider,
            'order_code' => $order->order_code === null ? null : (int) $order->order_code,
            'item_name' => $order->item_name,
            'coins_to_credit' => $order->coins_to_credit === null ? null : (int) $order->coins_to_credit,
            'created_at' => $this->dateTimeFromQuery($order->created_at),
        ];
    }

    private function dateTimeFromQuery(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return CarbonImmutable::parse((string) $value, 'UTC')->toISOString();
    }
}
