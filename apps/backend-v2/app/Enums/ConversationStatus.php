<?php

declare(strict_types=1);

namespace App\Enums;

enum ConversationStatus: string
{
    case Active = 'active';
    case Ended = 'ended';
}
