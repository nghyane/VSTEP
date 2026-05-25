<?php

declare(strict_types=1);

namespace App\Ai;

use Illuminate\Support\Facades\Config;
use RuntimeException;

/**
 * Validates AI config at boot time — fail-fast if misconfigured.
 */
final class AiConfigValidator
{
    private const VALID_WIRES = ['responses', 'chat', 'messages'];

    private const VALID_THINKING = ['none', 'low', 'medium', 'high'];

    /**
     * @throws RuntimeException on invalid config
     */
    public function validate(): void
    {
        $connections = Config::get('ai.connections', []);
        $models = Config::get('ai.models', []);
        $services = Config::get('ai.services', []);

        $this->validateConnections($connections);
        $this->validateModels($models, $connections);
        $this->validateServices($services, $models);
    }

    private function validateConnections(array $connections): void
    {
        if (empty($connections)) {
            throw new RuntimeException('ai.connections: no connections defined');
        }

        foreach ($connections as $name => $config) {
            if (empty($config['url'])) {
                throw new RuntimeException("ai.connections.{$name}: missing 'url'");
            }
        }
    }

    private function validateModels(array $models, array $connections): void
    {
        foreach ($models as $name => $config) {
            $conn = $config['connection'] ?? null;
            if ($conn === null || ! isset($connections[$conn])) {
                throw new RuntimeException(
                    "ai.models.{$name}: references undefined connection '{$conn}'"
                );
            }

            $wire = $config['wire'] ?? 'chat';
            if (! in_array($wire, self::VALID_WIRES, true)) {
                throw new RuntimeException(
                    "ai.models.{$name}: invalid wire '{$wire}', must be one of: ".implode(', ', self::VALID_WIRES)
                );
            }

            $thinking = $config['thinking'] ?? 'none';
            if (! in_array($thinking, self::VALID_THINKING, true)) {
                throw new RuntimeException(
                    "ai.models.{$name}: invalid thinking '{$thinking}', must be one of: ".implode(', ', self::VALID_THINKING)
                );
            }
        }
    }

    private function validateServices(array $services, array $models): void
    {
        if (empty($services)) {
            throw new RuntimeException('ai.services: no services defined');
        }

        foreach ($services as $name => $config) {
            $model = $config['model'] ?? null;
            if ($model === null) {
                throw new RuntimeException("ai.services.{$name}: missing 'model'");
            }

            if (! isset($models[$model])) {
                throw new RuntimeException(
                    "ai.services.{$name}: references undefined model '{$model}'"
                );
            }
        }
    }
}
