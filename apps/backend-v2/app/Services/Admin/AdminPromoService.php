<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\PromoCode;
use Illuminate\Database\Eloquent\Builder;

final class AdminPromoService
{
    /**
     * Alphabet cho auto-generate code: loại bỏ 0/O, 1/I/L để admin in ấn
     * voucher giấy không gây nhầm. Dùng random_int (CSPRNG) đồng nhất với
     * generateMeetUrl trong CourseService.
     */
    private const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /**
     * Status filter UI:
     *  - active    : is_active=true AND (expires_at NULL OR expires_at > now)
     *  - inactive  : is_active=false
     *  - expired   : is_active=true AND expires_at <= now
     */
    public function list(?string $q, ?string $status): Builder
    {
        $query = PromoCode::query()
            ->select(['id', 'code', 'partner_name', 'amount_coins', 'max_total_uses', 'per_account_limit', 'expires_at', 'is_active', 'created_at', 'updated_at'])
            ->withCount('redemptions');

        if ($q !== null && $q !== '') {
            $like = '%'.strtoupper($q).'%';
            $query->where(function (Builder $b) use ($like, $q): void {
                $b->where('code', 'ilike', $like)
                    ->orWhere('partner_name', 'ilike', '%'.$q.'%');
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true)
                ->where(function (Builder $b): void {
                    $b->whereNull('expires_at')->orWhere('expires_at', '>', now());
                });
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'expired') {
            $query->where('is_active', true)->where('expires_at', '<=', now());
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * Sinh code random từ CODE_ALPHABET (no ambiguous chars), retry nếu trùng.
     */
    public function generateUniqueCode(int $length = 8): string
    {
        $max = strlen(self::CODE_ALPHABET) - 1;
        do {
            $code = '';
            for ($i = 0; $i < $length; $i++) {
                $code .= self::CODE_ALPHABET[random_int(0, $max)];
            }
        } while (PromoCode::query()->where('code', $code)->exists());

        return $code;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): PromoCode
    {
        return PromoCode::create($input);
    }

    /**
     * @param  array<string, mixed>  $input
     */
    public function update(PromoCode $promo, array $input): PromoCode
    {
        $promo->fill($input);
        $promo->save();

        return $promo;
    }
}
