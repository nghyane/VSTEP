<?php

declare(strict_types=1);

namespace App\Ai;

/**
 * Port — domain services depend on this interface only.
 * No knowledge of providers, wire formats, or HTTP.
 *
 * All LLM calls use toolCall (function-calling) for structured output.
 * No plain text path — avoids think-tags and model-specific formatting issues.
 */
interface AiClient
{
    /**
     * @param  array<string,mixed>  $parametersSchema
     * @return array<string,mixed>
     */
    public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array;
}
