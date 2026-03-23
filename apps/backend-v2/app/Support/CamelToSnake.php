<?php

namespace App\Support;

use Illuminate\Support\Str;

class CamelToSnake
{
    /**
     * Map camelCase request keys to snake_case DB columns.
     * Only includes keys that exist in $data.
     */
    public static function map(array $data, array $keyMap): array
    {
        $fields = [];
        foreach ($keyMap as $camel => $snake) {
            if (array_key_exists($camel, $data)) {
                $fields[$snake] = $data[$camel];
            }
        }
        return $fields;
    }

    /**
     * Auto-convert all camelCase keys to snake_case.
     * Use when key names match (e.g. 'title' → 'title', 'isActive' → 'is_active').
     */
    public static function auto(array $data, array $allowedKeys): array
    {
        $fields = [];
        foreach ($allowedKeys as $camel) {
            if (array_key_exists($camel, $data)) {
                $fields[Str::snake($camel)] = $data[$camel];
            }
        }
        return $fields;
    }
}
