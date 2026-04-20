<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * VSTEP level taxonomy. A1/A2 chỉ dùng làm entry_level tự đánh giá,
 * không phải target. Target level mặc định bắt đầu từ B1.
 */
enum VstepLevel: string
{
    case A1 = 'A1';
    case A2 = 'A2';
    case B1 = 'B1';
    case B2 = 'B2';
    case C1 = 'C1';

    public static function targetOptions(): array
    {
        return [self::B1, self::B2, self::C1];
    }
}
