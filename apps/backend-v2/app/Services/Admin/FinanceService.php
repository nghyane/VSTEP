<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Models\CourseEnrollmentOrder;
use App\Models\WalletTopupOrder;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class FinanceService
{
    private const TYPE_TOPUP = 'topup';

    private const TYPE_COURSE = 'course';

    private const MAX_PER_PAGE = 100;

    /** @return array<string, mixed> */
    public function summary(): array
    {
        $today = now()->startOfDay();
        $week = now()->subDays(7)->startOfDay();
        $month = now()->subDays(30)->startOfDay();

        $topupToday = $this->paidSum('wallet_topup_orders', $today);
        $topupWeek = $this->paidSum('wallet_topup_orders', $week);
        $topupMonth = $this->paidSum('wallet_topup_orders', $month);
        $topupTotal = $this->paidSum('wallet_topup_orders');

        $courseToday = $this->paidSum('course_enrollment_orders', $today);
        $courseWeek = $this->paidSum('course_enrollment_orders', $week);
        $courseMonth = $this->paidSum('course_enrollment_orders', $month);
        $courseTotal = $this->paidSum('course_enrollment_orders');

        $paidOrders = $this->statusCount(OrderStatus::Paid->value);
        $allOrders = $this->allOrderCount();

        return [
            'revenue' => [
                'today' => $topupToday + $courseToday,
                'week' => $topupWeek + $courseWeek,
                'month' => $topupMonth + $courseMonth,
                'total' => $topupTotal + $courseTotal,
                'topup_total' => $topupTotal,
                'course_total' => $courseTotal,
            ],
            'orders' => [
                'total' => $allOrders,
                'paid' => $paidOrders,
                'pending' => $this->statusCount(OrderStatus::Pending->value),
                'failed' => $this->statusCount(OrderStatus::Failed->value),
                'cancelled' => $this->statusCount(OrderStatus::Cancelled->value),
                'expired' => $this->statusCount(OrderStatus::Expired->value),
                'success_rate' => $allOrders > 0 ? round($paidOrders / $allOrders * 100, 2) : 0.0,
            ],
            'sources' => [
                'topup' => [
                    'orders' => (int) WalletTopupOrder::query()->count(),
                    'paid_orders' => (int) WalletTopupOrder::query()->where('status', OrderStatus::Paid)->count(),
                    'revenue_vnd' => $topupTotal,
                ],
                'course' => [
                    'orders' => (int) CourseEnrollmentOrder::query()->count(),
                    'paid_orders' => (int) CourseEnrollmentOrder::query()->where('status', OrderStatus::Paid)->count(),
                    'revenue_vnd' => $courseTotal,
                ],
            ],
        ];
    }

    /** @param array<string, mixed> $filters */
    public function orders(array $filters): LengthAwarePaginator
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(self::MAX_PER_PAGE, max(1, (int) ($filters['per_page'] ?? 20)));
        $type = $this->stringFilter($filters, 'type');

        $query = match ($type) {
            self::TYPE_TOPUP => $this->topupOrderQuery($filters),
            self::TYPE_COURSE => $this->courseOrderQuery($filters),
            default => $this->topupOrderQuery($filters)->unionAll($this->courseOrderQuery($filters)),
        };

        $base = DB::query()->fromSub($query, 'orders');
        $total = (clone $base)->count();
        $orders = $base
            ->orderByDesc('created_at')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn (object $order): array => $this->orderRowFromQuery($order))
            ->values();

        return new Paginator(
            $orders,
            $total,
            $perPage,
            $page,
        );
    }

    /** @return array<string, mixed> */
    public function orderDetail(string $type, string $id): array
    {
        if ($type === self::TYPE_TOPUP) {
            $order = WalletTopupOrder::query()
                ->with(['profile.account', 'package'])
                ->findOrFail($id);

            return [
                ...$this->topupOrderRow($order),
                'gateway_response' => $order->gateway_response,
                'coins_to_credit' => $order->coins_to_credit,
                'callback_received_at' => $order->callback_received_at?->toISOString(),
                'expires_at' => $order->expires_at?->toISOString(),
            ];
        }

        if ($type === self::TYPE_COURSE) {
            $order = CourseEnrollmentOrder::query()
                ->with(['profile.account', 'course'])
                ->findOrFail($id);

            return [
                ...$this->courseOrderRow($order),
                'gateway_response' => $order->gateway_response,
                'callback_received_at' => $order->callback_received_at?->toISOString(),
                'expires_at' => $order->expires_at?->toISOString(),
            ];
        }

        throw new InvalidArgumentException('Unsupported finance order type.');
    }

    /** @return array<string, list<array<string, mixed>>> */
    public function topProducts(): array
    {
        $topup = DB::table('wallet_topup_orders as o')
            ->leftJoin('wallet_topup_packages as p', 'p.id', '=', 'o.package_id')
            ->where('o.status', OrderStatus::Paid->value)
            ->selectRaw("COALESCE(p.label, 'Gói nạp đã xóa') as name, COUNT(*) as orders, SUM(o.amount_vnd) as revenue_vnd")
            ->groupBy('p.id', 'p.label')
            ->orderByDesc('revenue_vnd')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'name' => $row->name,
                'orders' => (int) $row->orders,
                'revenue_vnd' => (int) $row->revenue_vnd,
            ])
            ->all();

        $course = DB::table('course_enrollment_orders as o')
            ->leftJoin('courses as c', 'c.id', '=', 'o.course_id')
            ->where('o.status', OrderStatus::Paid->value)
            ->selectRaw("COALESCE(c.title, 'Khóa học đã xóa') as name, COUNT(*) as orders, SUM(o.amount_vnd) as revenue_vnd")
            ->groupBy('c.id', 'c.title')
            ->orderByDesc('revenue_vnd')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'name' => $row->name,
                'orders' => (int) $row->orders,
                'revenue_vnd' => (int) $row->revenue_vnd,
            ])
            ->all();

        return ['topup' => $topup, 'course' => $course];
    }

    /** @return array<string, mixed> */
    public function coinSummary(): array
    {
        $base = DB::table('coin_transactions');
        $totalTransactions = (clone $base)->count();
        $creditTotal = (int) (clone $base)->where('delta', '>', 0)->sum('delta');
        $debitTotal = abs((int) (clone $base)->where('delta', '<', 0)->sum('delta'));
        $activeUsers = (int) (clone $base)->distinct('account_id')->count('account_id');

        $breakdown = DB::table('coin_transactions')
            ->selectRaw('type, COUNT(*) as transactions, SUM(CASE WHEN delta > 0 THEN delta ELSE 0 END) as credit_total, ABS(SUM(CASE WHEN delta < 0 THEN delta ELSE 0 END)) as debit_total, SUM(delta) as net_total')
            ->groupBy('type')
            ->orderByDesc('transactions')
            ->get()
            ->map(fn (object $row): array => [
                'type' => $row->type,
                'transactions' => (int) $row->transactions,
                'credit_total' => (int) $row->credit_total,
                'debit_total' => (int) $row->debit_total,
                'net_total' => (int) $row->net_total,
            ])
            ->values()
            ->all();

        return [
            'totals' => [
                'transactions' => (int) $totalTransactions,
                'credit_total' => $creditTotal,
                'debit_total' => $debitTotal,
                'net_total' => $creditTotal - $debitTotal,
                'active_users' => $activeUsers,
            ],
            'breakdown' => $breakdown,
        ];
    }

    /** @param array<string, mixed> $filters */
    public function coinTransactions(array $filters): LengthAwarePaginator
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(self::MAX_PER_PAGE, max(1, (int) ($filters['per_page'] ?? 20)));
        $query = DB::table('coin_transactions as tx')
            ->leftJoin('users as u', 'u.id', '=', 'tx.account_id')
            ->leftJoin('profiles as p', 'p.id', '=', 'tx.profile_id')
            ->selectRaw('tx.id, tx.type, tx.delta, tx.balance_after, tx.source_type, tx.source_id, tx.metadata, tx.created_at, u.id as user_id, u.full_name as user_name, u.email as user_email, p.id as profile_id, p.nickname as profile_nickname');

        $this->applyCoinTransactionFilters($query, $filters);

        $total = (clone $query)->count();
        $transactions = $query
            ->orderByDesc('tx.id')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn (object $transaction): array => $this->coinTransactionRow($transaction))
            ->values();

        return new Paginator($transactions, $total, $perPage, $page);
    }

    private function paidSum(string $table, mixed $since = null): int
    {
        $query = DB::table($table)->where('status', OrderStatus::Paid->value);
        if ($since !== null) {
            $query->where('paid_at', '>=', $since);
        }

        return (int) $query->sum('amount_vnd');
    }

    /** @param array<string, mixed> $filters */
    private function applyCoinTransactionFilters(QueryBuilder $query, array $filters): void
    {
        $from = $this->stringFilter($filters, 'from');
        if ($from !== null) {
            $query->where('tx.created_at', '>=', CarbonImmutable::parse($from)->startOfDay());
        }

        $to = $this->stringFilter($filters, 'to');
        if ($to !== null) {
            $query->where('tx.created_at', '<=', CarbonImmutable::parse($to)->endOfDay());
        }

        $type = $this->stringFilter($filters, 'type');
        if ($type !== null) {
            $query->where('tx.type', $type);
        }

        $sourceType = $this->stringFilter($filters, 'source_type');
        if ($sourceType !== null) {
            $query->where('tx.source_type', $sourceType);
        }

        $direction = $this->stringFilter($filters, 'direction');
        if ($direction === 'credit') {
            $query->where('tx.delta', '>', 0);
        }
        if ($direction === 'debit') {
            $query->where('tx.delta', '<', 0);
        }

        $q = $this->stringFilter($filters, 'q');
        if ($q !== null) {
            $query->where(function (QueryBuilder $inner) use ($q): void {
                if (ctype_digit($q)) {
                    $inner->where('tx.id', (int) $q);
                }

                $inner->orWhere('u.email', 'like', "%{$q}%")
                    ->orWhere('u.full_name', 'like', "%{$q}%")
                    ->orWhere('p.nickname', 'like', "%{$q}%")
                    ->orWhere('tx.source_id', 'like', "%{$q}%");
            });
        }
    }

    /** @return array<string, mixed> */
    private function coinTransactionRow(object $transaction): array
    {
        return [
            'id' => (int) $transaction->id,
            'type' => $transaction->type,
            'delta' => (int) $transaction->delta,
            'balance_after' => (int) $transaction->balance_after,
            'source_type' => $transaction->source_type,
            'source_id' => $transaction->source_id,
            'metadata' => $transaction->metadata === null ? null : json_decode((string) $transaction->metadata, true),
            'created_at' => $this->dateTimeFromQuery($transaction->created_at),
            'user' => $transaction->user_id === null ? null : ['id' => $transaction->user_id, 'name' => $transaction->user_name, 'email' => $transaction->user_email],
            'profile' => $transaction->profile_id === null ? null : ['id' => $transaction->profile_id, 'nickname' => $transaction->profile_nickname],
        ];
    }

    private function statusCount(string $status): int
    {
        return (int) WalletTopupOrder::query()->where('status', $status)->count()
            + (int) CourseEnrollmentOrder::query()->where('status', $status)->count();
    }

    private function allOrderCount(): int
    {
        return (int) WalletTopupOrder::query()->count()
            + (int) CourseEnrollmentOrder::query()->count();
    }

    /** @param array<string, mixed> $filters */
    private function topupOrderQuery(array $filters): QueryBuilder
    {
        $query = DB::table('wallet_topup_orders as o')
            ->leftJoin('profiles as p', 'p.id', '=', 'o.profile_id')
            ->leftJoin('users as u', 'u.id', '=', 'p.account_id')
            ->leftJoin('wallet_topup_packages as item', 'item.id', '=', 'o.package_id')
            ->selectRaw("o.id, 'topup' as type, 'Nạp coin' as type_label, o.status, o.amount_vnd, o.payment_provider as provider, o.provider_ref, o.order_code, o.gateway_transaction_id, u.id as user_id, u.full_name as user_name, u.email as user_email, p.id as profile_id, p.nickname as profile_nickname, item.id as item_id, COALESCE(item.label, 'Gói nạp đã xóa') as item_name, 'topup' as item_kind, o.created_at, o.paid_at");

        $this->applyCommonQueryFilters($query, $filters);

        return $query;
    }

    /** @param array<string, mixed> $filters */
    private function courseOrderQuery(array $filters): QueryBuilder
    {
        $query = DB::table('course_enrollment_orders as o')
            ->leftJoin('profiles as p', 'p.id', '=', 'o.profile_id')
            ->leftJoin('users as u', 'u.id', '=', 'p.account_id')
            ->leftJoin('courses as item', 'item.id', '=', 'o.course_id')
            ->selectRaw("o.id, 'course' as type, 'Mua khóa học' as type_label, o.status, o.amount_vnd, o.payment_provider as provider, o.provider_ref, o.order_code, o.gateway_transaction_id, u.id as user_id, u.full_name as user_name, u.email as user_email, p.id as profile_id, p.nickname as profile_nickname, item.id as item_id, COALESCE(item.title, 'Khóa học đã xóa') as item_name, 'course' as item_kind, o.created_at, o.paid_at");

        $this->applyCommonQueryFilters($query, $filters);

        return $query;
    }

    /** @param array<string, mixed> $filters */
    private function applyCommonQueryFilters(QueryBuilder $query, array $filters): void
    {
        $status = $this->stringFilter($filters, 'status');
        if ($status !== null) {
            $query->where('o.status', $status);
        }

        $provider = $this->stringFilter($filters, 'provider');
        if ($provider !== null) {
            $query->where('o.payment_provider', $provider);
        }

        $from = $this->stringFilter($filters, 'from');
        if ($from !== null) {
            $query->where('o.created_at', '>=', CarbonImmutable::parse($from)->startOfDay());
        }

        $to = $this->stringFilter($filters, 'to');
        if ($to !== null) {
            $query->where('o.created_at', '<=', CarbonImmutable::parse($to)->endOfDay());
        }

        $q = $this->stringFilter($filters, 'q');
        if ($q !== null) {
            $query->where(function (QueryBuilder $inner) use ($q): void {
                if (ctype_digit($q)) {
                    $inner->where('o.order_code', (int) $q);
                }

                $inner->orWhere('o.provider_ref', 'like', "%{$q}%")
                    ->orWhere('o.gateway_transaction_id', 'like', "%{$q}%")
                    ->orWhere('u.email', 'like', "%{$q}%")
                    ->orWhere('u.full_name', 'like', "%{$q}%");
            });
        }
    }

    /** @return array<string, mixed> */
    private function orderRowFromQuery(object $order): array
    {
        return [
            'id' => $order->id,
            'type' => $order->type,
            'type_label' => $order->type_label,
            'status' => $order->status,
            'amount_vnd' => (int) $order->amount_vnd,
            'provider' => $order->provider,
            'provider_ref' => $order->provider_ref,
            'order_code' => $order->order_code === null ? null : (int) $order->order_code,
            'gateway_transaction_id' => $order->gateway_transaction_id,
            'user' => $order->user_id === null ? null : ['id' => $order->user_id, 'name' => $order->user_name, 'email' => $order->user_email],
            'profile' => $order->profile_id === null ? null : ['id' => $order->profile_id, 'nickname' => $order->profile_nickname],
            'item' => ['id' => $order->item_id, 'name' => $order->item_name, 'kind' => $order->item_kind],
            'created_at' => $this->dateTimeFromQuery($order->created_at),
            'paid_at' => $this->dateTimeFromQuery($order->paid_at),
        ];
    }

    /** @return array<string, mixed> */
    private function topupOrderRow(WalletTopupOrder $order): array
    {
        $account = $order->profile?->account;

        return [
            'id' => $order->id,
            'type' => self::TYPE_TOPUP,
            'type_label' => 'Nạp coin',
            'status' => $order->status->value,
            'amount_vnd' => $order->amount_vnd,
            'provider' => $order->payment_provider,
            'provider_ref' => $order->provider_ref,
            'order_code' => $order->order_code,
            'gateway_transaction_id' => $order->gateway_transaction_id,
            'user' => $account ? ['id' => $account->id, 'name' => $account->full_name, 'email' => $account->email] : null,
            'profile' => $order->profile ? ['id' => $order->profile->id, 'nickname' => $order->profile->nickname] : null,
            'item' => ['id' => $order->package?->id, 'name' => $order->package?->label ?? 'Gói nạp đã xóa', 'kind' => self::TYPE_TOPUP],
            'created_at' => $order->created_at?->toISOString(),
            'paid_at' => $order->paid_at?->toISOString(),
        ];
    }

    /** @return array<string, mixed> */
    private function courseOrderRow(CourseEnrollmentOrder $order): array
    {
        $account = $order->profile?->account;

        return [
            'id' => $order->id,
            'type' => self::TYPE_COURSE,
            'type_label' => 'Mua khóa học',
            'status' => $order->status->value,
            'amount_vnd' => $order->amount_vnd,
            'provider' => $order->payment_provider,
            'provider_ref' => $order->provider_ref,
            'order_code' => $order->order_code,
            'gateway_transaction_id' => $order->gateway_transaction_id,
            'user' => $account ? ['id' => $account->id, 'name' => $account->full_name, 'email' => $account->email] : null,
            'profile' => $order->profile ? ['id' => $order->profile->id, 'nickname' => $order->profile->nickname] : null,
            'item' => ['id' => $order->course?->id, 'name' => $order->course?->title ?? 'Khóa học đã xóa', 'kind' => self::TYPE_COURSE],
            'created_at' => $order->created_at?->toISOString(),
            'paid_at' => $order->paid_at?->toISOString(),
        ];
    }

    /** @param array<string, mixed> $filters */
    private function stringFilter(array $filters, string $key): ?string
    {
        $value = $filters[$key] ?? null;
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function dateTimeFromQuery(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return CarbonImmutable::parse((string) $value, 'UTC')->toISOString();
    }
}
