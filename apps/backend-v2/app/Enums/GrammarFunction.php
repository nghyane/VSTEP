<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Grammar function — axis bổ sung để filter grammar points theo skill goal.
 * - accuracy: đúng về cấu trúc
 * - range: đa dạng cấu trúc
 * - coherence: gắn kết mạch văn
 * - register: giọng văn formal/informal
 */
enum GrammarFunction: string
{
    case Accuracy = 'accuracy';
    case Range = 'range';
    case Coherence = 'coherence';
    case Register = 'register';
}
