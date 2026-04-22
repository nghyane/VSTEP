<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Laravel\Ai\Promptable;

class GradingAgent
{
    use Promptable;

    public function provider(): string
    {
        return 'llm';
    }

    public function model(): string
    {
        return (string) config('ai.providers.llm.models.text.default', 'gpt-5.4');
    }

    public function timeout(): int
    {
        return 60;
    }

    public function instructions(): string
    {
        return '';
    }

    public function messages(): iterable
    {
        return [];
    }

    public function tools(): iterable
    {
        return [];
    }
}
