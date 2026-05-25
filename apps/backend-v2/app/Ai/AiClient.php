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
     * Send a prompt and get structured (JSON) output.
     *
     * @param  array<string,mixed>  $schema  JSON Schema definition for the response
     * @return array<string,mixed>
     */
    public function structured(string $service, string $prompt, array $schema, ?string $instructions = null): array;

    /**
     * Send a prompt and get plain text output.
     */
    public function text(string $service, string $prompt, ?string $instructions = null): string;
}
