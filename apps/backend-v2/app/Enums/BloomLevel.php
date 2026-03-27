<?php

declare(strict_types=1);

namespace App\Enums;

enum BloomLevel: string
{
    case Remember = 'remember';
    case Understand = 'understand';
    case Apply = 'apply';
    case Analyze = 'analyze';
    case Evaluate = 'evaluate';
    case Create = 'create';

    public function label(): string
    {
        return match ($this) {
            self::Remember => 'Nhớ (recall facts)',
            self::Understand => 'Hiểu (explain concepts)',
            self::Apply => 'Áp dụng (use in new situations)',
            self::Analyze => 'Phân tích (break down, compare)',
            self::Evaluate => 'Đánh giá (justify, argue)',
            self::Create => 'Sáng tạo (produce, design)',
        };
    }

    /**
     * Appropriate Bloom levels for each VSTEP level.
     *
     * @return list<self>
     */
    public static function forLevel(Level $level): array
    {
        return match ($level) {
            Level::A2 => [self::Remember, self::Understand],
            Level::B1 => [self::Understand, self::Apply, self::Analyze],
            Level::B2 => [self::Apply, self::Analyze, self::Evaluate],
            Level::C1 => [self::Analyze, self::Evaluate, self::Create],
        };
    }
}
