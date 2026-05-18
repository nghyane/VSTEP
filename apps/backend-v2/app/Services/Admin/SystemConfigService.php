<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\SystemConfig;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Admin-only service quản lý system_configs (key-value JSON store).
 *
 * Quy ước:
 * - Admin **chỉ được update** key đã tồn tại (seeded). Không tạo key arbitrary
 *   để tránh inject key vô nghĩa không có consumer phía code.
 * - Không xóa key (xóa → consumer call SystemConfig::get($k, $default) sẽ trả
 *   default → silently break behaviour). Nếu cần "reset", admin sửa value về
 *   default thủ công.
 * - Value là JSON arbitrary (scalar | array | object). Validate shape per-key
 *   ngoài scope service này — UI/FormRequest chịu trách nhiệm.
 */
final class SystemConfigService
{
    /**
     * @return Collection<int, SystemConfig>
     */
    public function list(): Collection
    {
        return SystemConfig::query()->orderBy('key')->get();
    }

    public function show(string $key): SystemConfig
    {
        $config = SystemConfig::query()->find($key);
        if (! $config) {
            throw ValidationException::withMessages([
                'key' => ["Key '{$key}' không tồn tại."],
            ]);
        }

        return $config;
    }

    /**
     * Cập nhật value cho key đã tồn tại. Throw nếu key chưa được seed.
     *
     * @param  mixed  $value  scalar | array | object — JSON-encodable
     */
    public function update(string $key, mixed $value): SystemConfig
    {
        $config = $this->show($key);

        $config->value = $value;
        $config->updated_at = now();
        $config->save();

        return $config->refresh();
    }
}
