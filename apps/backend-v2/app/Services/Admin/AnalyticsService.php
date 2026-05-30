<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Models\AssessmentJob;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Read-only analytics queries cho admin dashboard.
 *
 * Tách khỏi DashboardController vì:
 * - Số lượng metric phình to (10+ method)
 * - Mỗi metric có thể có biến thể (theo period) → service hợp lý hơn
 * - Dễ unit-test riêng query logic
 *
 * Quy ước:
 * - Tất cả series time-bucket: 1 row/day, gap-fill bằng 0 (FE không phải handle missing date)
 * - Tiền tệ: VND raw integer (FE format hiển thị)
 * - `days` param: default 30, clamp [7, 365]
 */
final class AnalyticsService
{
    private const MIN_DAYS = 7;

    private const MAX_DAYS = 365;

    /**
     * Tổng quan dòng tiền: topup + course enrollment, theo today/7d/30d.
     *
     * @return array<string, int|array<string, int>>
     */
    public function revenueOverview(): array
    {
        $today = now()->startOfDay();
        $week = now()->subDays(7)->startOfDay();
        $month = now()->subDays(30)->startOfDay();

        $sumPaid = fn (string $table, CarbonInterface $since): int => (int) DB::table($table)
            ->where('status', OrderStatus::Paid->value)
            ->where('paid_at', '>=', $since)
            ->sum('amount_vnd');

        $topupToday = $sumPaid('wallet_topup_orders', $today);
        $topupWeek = $sumPaid('wallet_topup_orders', $week);
        $topupMonth = $sumPaid('wallet_topup_orders', $month);

        $courseToday = $sumPaid('course_enrollment_orders', $today);
        $courseWeek = $sumPaid('course_enrollment_orders', $week);
        $courseMonth = $sumPaid('course_enrollment_orders', $month);

        return [
            'topup' => [
                'today' => $topupToday,
                'week' => $topupWeek,
                'month' => $topupMonth,
            ],
            'course' => [
                'today' => $courseToday,
                'week' => $courseWeek,
                'month' => $courseMonth,
            ],
            'total' => [
                'today' => $topupToday + $courseToday,
                'week' => $topupWeek + $courseWeek,
                'month' => $topupMonth + $courseMonth,
            ],
            'pending_orders' => (int) DB::table('wallet_topup_orders')->where('status', OrderStatus::Pending->value)->count()
                + (int) DB::table('course_enrollment_orders')->where('status', OrderStatus::Pending->value)->count(),
        ];
    }

    /**
     * Series doanh thu theo ngày (VND).
     *
     * @return list<array{date: string, topup_vnd: int, course_vnd: int, total_vnd: int}>
     */
    public function revenueTrend(int $days = 30): array
    {
        $days = $this->clampDays($days);
        $from = now()->subDays($days - 1)->startOfDay();

        $topup = DB::table('wallet_topup_orders')
            ->selectRaw('DATE(paid_at) as day, SUM(amount_vnd) as total')
            ->where('status', OrderStatus::Paid->value)
            ->where('paid_at', '>=', $from)
            ->groupBy('day')
            ->pluck('total', 'day')
            ->map(fn ($v) => (int) $v)
            ->all();

        $course = DB::table('course_enrollment_orders')
            ->selectRaw('DATE(paid_at) as day, SUM(amount_vnd) as total')
            ->where('status', OrderStatus::Paid->value)
            ->where('paid_at', '>=', $from)
            ->groupBy('day')
            ->pluck('total', 'day')
            ->map(fn ($v) => (int) $v)
            ->all();

        return $this->fillDailySeries($days, function (string $date) use ($topup, $course): array {
            $t = $topup[$date] ?? 0;
            $c = $course[$date] ?? 0;

            return [
                'date' => $date,
                'topup_vnd' => $t,
                'course_vnd' => $c,
                'total_vnd' => $t + $c,
            ];
        });
    }

    /**
     * Series user/profile mới theo ngày.
     *
     * @return list<array{date: string, new_users: int, new_profiles: int}>
     */
    public function userGrowth(int $days = 30): array
    {
        $days = $this->clampDays($days);
        $from = now()->subDays($days - 1)->startOfDay();

        $users = DB::table('users')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->pluck('total', 'day')
            ->map(fn ($v) => (int) $v)
            ->all();

        $profiles = DB::table('profiles')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->pluck('total', 'day')
            ->map(fn ($v) => (int) $v)
            ->all();

        return $this->fillDailySeries($days, fn (string $date): array => [
            'date' => $date,
            'new_users' => $users[$date] ?? 0,
            'new_profiles' => $profiles[$date] ?? 0,
        ]);
    }

    /**
     * Coin economy snapshot. Source-of-truth = bảng coin_transactions (append-only ledger).
     *
     * @return array<string, mixed>
     */
    public function walletEconomy(): array
    {
        $minted = (int) DB::table('coin_transactions')->where('delta', '>', 0)->sum('delta');
        $spent = (int) DB::table('coin_transactions')->where('delta', '<', 0)->sum(DB::raw('ABS(delta)'));

        $topPackages = DB::table('wallet_topup_orders as o')
            ->join('wallet_topup_packages as p', 'p.id', '=', 'o.package_id')
            ->where('o.status', OrderStatus::Paid->value)
            ->selectRaw('p.label, COUNT(*) as orders, SUM(o.amount_vnd) as revenue_vnd')
            ->groupBy('p.id', 'p.label')
            ->orderByDesc('orders')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'label' => $r->label,
                'orders' => (int) $r->orders,
                'revenue_vnd' => (int) $r->revenue_vnd,
            ])
            ->all();

        return [
            'coins_minted' => $minted,
            'coins_spent' => $spent,
            'coins_circulating' => $minted - $spent,
            'topup_orders_paid' => (int) DB::table('wallet_topup_orders')->where('status', OrderStatus::Paid->value)->count(),
            'topup_orders_pending' => (int) DB::table('wallet_topup_orders')->where('status', OrderStatus::Pending->value)->count(),
            'topup_orders_failed' => (int) DB::table('wallet_topup_orders')->whereIn('status', [OrderStatus::Failed->value, OrderStatus::Expired->value])->count(),
            'top_packages' => $topPackages,
        ];
    }

    /**
     * Activity theo ngày: practice sessions per module.
     *
     * @return list<array{date: string, listening: int, reading: int, writing: int, speaking: int, vocab: int, grammar: int}>
     */
    public function practiceActivity(int $days = 30): array
    {
        $days = $this->clampDays($days);
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = DB::table('practice_sessions')
            ->selectRaw('DATE(started_at) as day, module, COUNT(*) as total')
            ->where('started_at', '>=', $from)
            ->groupBy('day', 'module')
            ->get();

        $byDay = [];
        foreach ($rows as $r) {
            $byDay[$r->day][$r->module] = (int) $r->total;
        }

        return $this->fillDailySeries($days, fn (string $date): array => [
            'date' => $date,
            'listening' => $byDay[$date]['listening'] ?? 0,
            'reading' => $byDay[$date]['reading'] ?? 0,
            'writing' => $byDay[$date]['writing'] ?? 0,
            'speaking' => $byDay[$date]['speaking'] ?? 0,
            'vocab' => $byDay[$date]['vocab'] ?? 0,
            'grammar' => $byDay[$date]['grammar'] ?? 0,
        ]);
    }

    /**
     * Assessment queue throughput per day.
     *
     * @return list<array{date: string, done: int, failed: int, pending: int}>
     */
    public function gradingThroughput(int $days = 30): array
    {
        $days = $this->clampDays($days);
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = AssessmentJob::query()
            ->selectRaw('DATE(created_at) as day, status, COUNT(*) as total')
            ->where('created_at', '>=', $from)
            ->groupBy('day', 'status')
            ->get();

        $byDay = [];
        foreach ($rows as $r) {
            $byDay[$r->day][$r->status] = (int) $r->total;
        }

        return $this->fillDailySeries($days, fn (string $date): array => [
            'date' => $date,
            'done' => $byDay[$date]['ready'] ?? 0,
            'failed' => $byDay[$date]['failed'] ?? 0,
            'pending' => $byDay[$date]['pending'] ?? 0,
        ]);
    }

    /**
     * Profile segmentation theo target level & entry level.
     *
     * @return array<string, mixed>
     */
    public function profileSegments(): array
    {
        $byTarget = DB::table('profiles')
            ->selectRaw('target_level, COUNT(*) as total')
            ->groupBy('target_level')
            ->orderBy('target_level')
            ->get()
            ->map(fn ($r) => ['level' => $r->target_level ?? 'unset', 'count' => (int) $r->total])
            ->all();

        $byEntry = DB::table('profiles')
            ->selectRaw('entry_level, COUNT(*) as total')
            ->groupBy('entry_level')
            ->orderBy('entry_level')
            ->get()
            ->map(fn ($r) => ['level' => $r->entry_level ?? 'unset', 'count' => (int) $r->total])
            ->all();

        $active7d = (int) DB::table('profile_streak_state')
            ->where('last_active_date_local', '>=', now()->subDays(7)->toDateString())
            ->count();

        return [
            'total_profiles' => (int) DB::table('profiles')->count(),
            'active_profiles_7d' => $active7d,
            'by_target_level' => $byTarget,
            'by_entry_level' => $byEntry,
        ];
    }

    /**
     * Streak distribution buckets.
     *
     * @return list<array{range: string, count: int}>
     */
    public function streakDistribution(): array
    {
        $buckets = [
            '0' => 'current_streak = 0',
            '1-3' => 'current_streak BETWEEN 1 AND 3',
            '4-7' => 'current_streak BETWEEN 4 AND 7',
            '8-30' => 'current_streak BETWEEN 8 AND 30',
            '30+' => 'current_streak > 30',
        ];

        $result = [];
        foreach ($buckets as $range => $where) {
            $count = (int) DB::table('profile_streak_state')->whereRaw($where)->count();
            $result[] = ['range' => $range, 'count' => $count];
        }

        return $result;
    }

    /**
     * Promo redemption stats.
     *
     * @return array<string, mixed>
     */
    public function promoStats(): array
    {
        $today = now()->startOfDay();
        $week = now()->subDays(7)->startOfDay();

        $topCodes = DB::table('promo_code_redemptions as r')
            ->join('promo_codes as c', 'c.id', '=', 'r.promo_code_id')
            ->selectRaw('c.code, COUNT(*) as redemptions, SUM(r.coins_granted) as coins_total')
            ->groupBy('c.id', 'c.code')
            ->orderByDesc('redemptions')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'code' => $r->code,
                'redemptions' => (int) $r->redemptions,
                'coins_total' => (int) $r->coins_total,
            ])
            ->all();

        return [
            'redemptions_today' => (int) DB::table('promo_code_redemptions')->where('redeemed_at', '>=', $today)->count(),
            'redemptions_week' => (int) DB::table('promo_code_redemptions')->where('redeemed_at', '>=', $week)->count(),
            'coins_granted_total' => (int) DB::table('promo_code_redemptions')->sum('coins_granted'),
            'top_codes' => $topCodes,
        ];
    }

    /**
     * Top content theo lượng practice session.
     *
     * @return array<string, mixed>
     */
    public function topContent(): array
    {
        $topByModule = function (string $module, string $table, string $titleField, int $limit = 5): array {
            return DB::table('practice_sessions as s')
                ->join("{$table} as c", 'c.id', '=', 's.content_ref_id')
                ->where('s.module', $module)
                ->selectRaw("c.{$titleField} as title, COUNT(*) as sessions")
                ->groupBy('c.id', "c.{$titleField}")
                ->orderByDesc('sessions')
                ->limit($limit)
                ->get()
                ->map(fn ($r) => ['title' => $r->title, 'sessions' => (int) $r->sessions])
                ->all();
        };

        return [
            'listening' => $topByModule('listening', 'practice_listening_exercises', 'title'),
            'reading' => $topByModule('reading', 'practice_reading_exercises', 'title'),
            'writing' => $topByModule('writing', 'practice_writing_prompts', 'title'),
            'vocab' => $topByModule('vocab', 'vocab_topics', 'name'),
            'grammar' => $topByModule('grammar', 'grammar_points', 'name'),
        ];
    }

    private function clampDays(int $days): int
    {
        return max(self::MIN_DAYS, min(self::MAX_DAYS, $days));
    }

    /**
     * Generate ngày-by-ngày từ today-N+1 đến today, gọi callback cho mỗi ngày để build row.
     * Đảm bảo series liên tục (gap-fill = 0), FE không phải handle missing date.
     *
     * @template T of array
     *
     * @param  callable(string): T  $rowBuilder
     * @return list<T>
     */
    private function fillDailySeries(int $days, callable $rowBuilder): array
    {
        $result = [];
        $start = now()->subDays($days - 1)->startOfDay();
        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i)->toDateString();
            $result[] = $rowBuilder($date);
        }

        return $result;
    }
}
