<?php

declare(strict_types=1);

namespace App\Enums;

enum PlacementSource: string
{
    case SelfAssess = 'self_assess';
    case Placement = 'placement';
    case Skipped = 'skipped';
}
