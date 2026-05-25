<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin CRUD orchestration cho `wallet_topup_packages`.
 *
 * Đứng tách khỏi `TopupService` vì service đó sở hữu order lifecycle (gateway,
 * idempotent confirm). Service này chỉ quản package metadata, không touch
 * wallet credit hay payment.
 */
final class AdminTopupPackageService
{
    private const ALLOWED_SORT = ['display_order', 'amount_vnd', 'coins_base', 'created_at'];

    /**
     * @param  array<string,mixed>  $filters
     */
    public function listPackages(array $filters): Builder
    {
        $query = WalletTopupPackage::query();

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where('label', 'ilike', $term);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $sort = $filters['sort'] ?? 'display_order';
        if (! in_array($sort, self::ALLOWED_SORT, true)) {
            $sort = 'display_order';
        }
        $order = ($filters['order'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sort, $order)->orderBy('amount_vnd');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createPackage(array $data): WalletTopupPackage
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) WalletTopupPackage::query()->max('display_order') + 1;
        }
        $data['bonus_coins'] = $data['bonus_coins'] ?? 0;
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_best_value'] = $data['is_best_value'] ?? false;

        return DB::transaction(function () use ($data): WalletTopupPackage {
            if ($data['is_best_value'] === true) {
                WalletTopupPackage::query()->where('is_best_value', true)->update(['is_best_value' => false]);
            }

            return WalletTopupPackage::query()->create($data);
        });
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updatePackage(WalletTopupPackage $package, array $data): WalletTopupPackage
    {
        return DB::transaction(function () use ($package, $data): WalletTopupPackage {
            if (array_key_exists('is_best_value', $data) && $data['is_best_value'] === true) {
                WalletTopupPackage::query()
                    ->whereKeyNot($package->id)
                    ->where('is_best_value', true)
                    ->update(['is_best_value' => false]);
            }

            $package->fill($data)->save();

            return $package->fresh();
        });
    }

    /**
     * Hard delete chỉ khi chưa có order tham chiếu. FK `wallet_topup_orders.package_id`
     * dùng `restrictOnDelete` → Postgres sẽ throw 23503; chặn sớm để trả 422 rõ ràng
     * thay vì 500. Package không xoá được thì admin nên `deactivate` để ẩn khỏi user.
     */
    public function deletePackage(WalletTopupPackage $package): void
    {
        if (WalletTopupOrder::query()->where('package_id', $package->id)->exists()) {
            throw ValidationException::withMessages([
                'package' => ['Gói nạp đã có đơn thanh toán, không thể xoá. Hãy chuyển sang trạng thái tạm ẩn.'],
            ]);
        }

        $package->delete();
    }

    public function setActive(WalletTopupPackage $package, bool $active): WalletTopupPackage
    {
        $package->update(['is_active' => $active]);

        return $package->fresh();
    }
}
