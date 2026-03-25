<?php

declare(strict_types=1);

namespace App\Enums;

enum Platform: string
{
    case Ios = 'ios';
    case Android = 'android';
    case Web = 'web';
}
