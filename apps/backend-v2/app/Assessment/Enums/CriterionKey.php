<?php

declare(strict_types=1);

namespace App\Assessment\Enums;

enum CriterionKey: string
{
    case Grammar = 'grammar';
    case Vocabulary = 'vocabulary';
    case TaskFulfillment = 'task_fulfillment';
    case Organization = 'organization';
    case Fluency = 'fluency';
    case DiscourseManagement = 'discourse_management';
    case Pronunciation = 'pronunciation';
    case ContentRelevance = 'content_relevance';
    case Reasoning = 'reasoning';
    case DiscussionDepth = 'discussion_depth';
}
