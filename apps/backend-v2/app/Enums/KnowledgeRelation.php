<?php

declare(strict_types=1);

namespace App\Enums;

enum KnowledgeRelation: string
{
    case PartOf = 'part_of';
    case Prerequisite = 'prerequisite';
    case Related = 'related';
}
