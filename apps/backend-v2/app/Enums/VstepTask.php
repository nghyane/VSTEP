<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * VSTEP skill taxonomy dùng chung cho nhiều module.
 * WT = Writing Task, SP = Speaking Part, READ = Reading.
 */
enum VstepTask: string
{
    case WritingTask1 = 'WT1';
    case WritingTask2 = 'WT2';
    case SpeakingPart1 = 'SP1';
    case SpeakingPart2 = 'SP2';
    case SpeakingPart3 = 'SP3';
    case Reading = 'READ';
}
