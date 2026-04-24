<?php

declare(strict_types=1);

return [
    'llm' => [
        'base_url' => env('LLM_BASE_URL', 'http://localhost:11434'),
        'model' => env('LLM_MODEL', 'gemini-3-flash-preview'),
        'api_key' => env('LLM_API_KEY', ''),
    ],
];
