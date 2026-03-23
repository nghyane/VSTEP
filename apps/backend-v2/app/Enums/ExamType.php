<?php

namespace App\Enums;

enum ExamType: string
{
    case Practice = 'practice';
    case Placement = 'placement';
    case Mock = 'mock';
}
