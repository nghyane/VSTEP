<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Connections
    |--------------------------------------------------------------------------
    |
    | Transport layer — URL + credentials. Provider-agnostic.
    | Same connection can serve multiple wire formats.
    |
    */

    'connections' => [
        'packy' => [
            'url' => env('PACKY_URL', 'https://www.packyapi.com'),
            'key' => env('PACKY_API_KEY', ''),
        ],
        'groq' => [
            'url' => 'https://api.groq.com/openai',
            'key' => env('GROQ_API_KEY', ''),
        ],
        'openrouter' => [
            'url' => env('OPENROUTER_URL', 'https://openrouter.ai/api'),
            'key' => env('OPENROUTER_API_KEY', ''),
        ],
        'local' => [
            'url' => env('LOCAL_AI_URL', 'http://localhost:11434'),
            'key' => env('LOCAL_AI_KEY', ''),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Models
    |--------------------------------------------------------------------------
    |
    | Each model declares: connection + wire format + model ID.
    | Wire format is a property of the model, not the service.
    |
    | Supported wires: messages (Anthropic Messages API)
    |
    */

    'models' => [
        'deepseek-v4-pro' => [
            'connection' => 'packy',
            'wire' => 'messages',
            'id' => 'deepseek-v4-pro',
            'thinking' => 'none',
        ],
        'deepseek-v4-flash' => [
            'connection' => 'packy',
            'wire' => 'messages',
            'id' => 'deepseek-v4-flash',
            'thinking' => 'none',
        ],
        'claude-haiku-4-5' => [
            'connection' => 'packy',
            'wire' => 'messages',
            'id' => 'claude-haiku-4-5-20251001',
            'thinking' => 'none',
        ],
        'qwen3-vl-flash' => [
            'connection' => 'packy',
            'wire' => 'messages',
            'id' => 'qwen3-vl-flash',
            'thinking' => 'none',
        ],
        'qwen3-5-flash' => [
            'connection' => 'packy',
            'wire' => 'messages',
            'id' => 'qwen3.5-flash',
            'thinking' => 'none',
        ],
        'qwen3-32b' => [
            'connection' => 'groq',
            'wire' => 'chat',
            'id' => 'qwen/qwen3-32b',
            'thinking' => 'none',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Services
    |--------------------------------------------------------------------------
    |
    | Each service maps to a model name above. Domain code references
    | service names only — never provider/wire/connection directly.
    |
    */

    'services' => [
        'grading' => [
            'model' => env('AI_GRADING_MODEL', 'deepseek-v4-flash'),
            'timeout' => 60,
            'temperature' => 0.0,
        ],
        'conversation' => [
            'model' => env('AI_CONVERSATION_MODEL', 'deepseek-v4-flash'),
            'timeout' => 30,
        ],
        'pronunciation' => [
            'model' => env('AI_PRONUNCIATION_MODEL', 'deepseek-v4-flash'),
            'timeout' => 30,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Laravel AI Framework (kept for transcription/embeddings)
    |--------------------------------------------------------------------------
    */

    'default' => 'openai',
    'default_for_audio' => 'openai',
    'default_for_transcription' => 'openai',
    'default_for_embeddings' => 'openai',

    'caching' => [
        'embeddings' => [
            'cache' => false,
            'store' => env('CACHE_STORE', 'database'),
        ],
    ],

    'providers' => [
        'openai' => [
            'driver' => 'openai',
            'key' => env('OPENAI_API_KEY'),
            'url' => env('OPENAI_BASE_URL'),
        ],
    ],

];
