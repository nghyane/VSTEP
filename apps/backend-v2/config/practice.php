<?php

declare(strict_types=1);

return [
    /**
     * Rate limits for practice endpoints.
     * Format: 'requests,minutes' — matches Laravel throttle middleware.
     */
    'rate_limits' => [
        'pronunciation_review' => env('RATE_PRONUNCIATION_REVIEW', '30,1'),
        'conversation_turn' => env('RATE_CONVERSATION_TURN', '60,1'),
        'conversation_review' => env('RATE_CONVERSATION_REVIEW', '30,1'),
    ],
];
