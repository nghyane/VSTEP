<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

final class FeedbackCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly string $submissionId,
        public readonly array $feedback,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("feedback.{$this->submissionId}")];
    }

    public function broadcastAs(): string
    {
        return 'feedback.completed';
    }
}
