<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Key-value store cho admin tunable parameters.
 * Primary key = key (string), không HasUuids.
 *
 * Value là JSON để support cả scalar (số, string, bool) lẫn object.
 * Dùng SystemConfig::get('chart.min_tests') để read với type cast.
 */
#[Fillable(['key', 'value', 'description'])]
class SystemConfig extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'updated_at' => 'datetime',
        ];
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    /**
     * Lấy value theo key. Trả default nếu key không tồn tại.
     *
     * Note: 'value' được cast array, nên scalar JSON (e.g. 100, "utc")
     * sẽ vẫn decode thành raw scalar khi Laravel parse.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::query()->find($key);

        return $row?->value ?? $default;
    }

    public static function set(string $key, mixed $value, ?string $description = null): void
    {
        static::query()->updateOrInsert(
            ['key' => $key],
            [
                'value' => json_encode($value),
                'description' => $description,
                'updated_at' => now(),
            ],
        );
    }
}
