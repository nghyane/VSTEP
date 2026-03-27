<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationType: string
{
    case GradingComplete = 'grading_complete';
    case GoalAchieved = 'goal_achieved';
    case StreakMilestone = 'streak_milestone';
    case SessionAbandoned = 'session_abandoned';
    case Feedback = 'feedback';
    case ClassInvite = 'class_invite';
    case System = 'system';
}
