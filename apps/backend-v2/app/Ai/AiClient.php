<?php

declare(strict_types=1);

namespace App\Ai;

/**
 * Port — domain services depend on this interface only.
 * No knowledge of providers, wire formats, or HTTP.
 */
interface AiClient
{
    /**
     * Send a prompt and get structured (JSON) output via tool calling.
     *
     * Uses function-calling / tool_use across all providers for maximum
     * compatibility — avoids response_format: json_schema provider-specific issues.
     *
     * @param  array<string,mixed>  $parametersSchema  JSON Schema definition for the function parameters
     * @return array<string,mixed>
     */
    public function toolCall(string $service, string $prompt, string $toolName, string $toolDescription, array $parametersSchema, ?string $instructions = null): array;

    /**
     * Send a prompt and get plain text output.
     */
    public function text(string $service, string $prompt, ?string $instructions = null): string;
}
