<?php

declare(strict_types=1);

namespace App\Ai;

use Illuminate\JsonSchema\Types\ArrayType;
use Illuminate\JsonSchema\Types\BooleanType;
use Illuminate\JsonSchema\Types\IntegerType;
use Illuminate\JsonSchema\Types\NumberType;
use Illuminate\JsonSchema\Types\ObjectType;
use Illuminate\JsonSchema\Types\StringType;
use Illuminate\JsonSchema\Types\Type;
use Illuminate\Support\Collection;
use Laravel\Ai\Contracts\Providers\TextProvider;
use Laravel\Ai\Exceptions\AiException;
use Laravel\Ai\Gateway\TextGenerationOptions;
use Laravel\Ai\Providers\Provider;
use Laravel\Ai\Responses\Data\FinishReason;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Step;
use Laravel\Ai\Responses\Data\ToolCall;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\StructuredTextResponse;
use Laravel\Ai\Responses\TextResponse;

class ChatCompletionsGateway extends LocalOpenAiGateway
{
    protected function buildTextRequestBody(
        Provider $provider,
        string $model,
        ?string $instructions,
        array $messages,
        array $tools,
        ?array $schema,
        ?TextGenerationOptions $options,
    ): array {
        $body = [
            'model' => $model,
            'messages' => $this->mapMessagesToChatMessages($messages, $instructions),
        ];

        if (! is_null($options?->temperature)) {
            $body['temperature'] = $options->temperature;
        }

        if (! empty($tools)) {
            $body['tools'] = $this->mapToolsForChatCompletions($tools);
            $body['tool_choice'] = 'auto';
        }

        if ($schema !== null) {
            $body['response_format'] = [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => 'structured_output',
                    'schema' => [
                        'type' => 'object',
                        'properties' => $this->mapSchemaProperties($schema),
                        'required' => array_keys($schema),
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ];
        }

        return $body;
    }

    public function generateText(
        TextProvider $provider,
        string $model,
        ?string $instructions,
        array $messages = [],
        array $tools = [],
        ?array $schema = null,
        ?TextGenerationOptions $options = null,
        ?int $timeout = null,
    ): TextResponse {
        $body = $this->buildTextRequestBody($provider, $model, $instructions, $messages, $tools, $schema, $options);

        $response = $this->client($provider, $timeout)->post('chat/completions', $body);
        $data = $response->json();

        if (! is_array($data) || isset($data['error'])) {
            throw new AiException(sprintf(
                'OpenAI Error: [%s] %s',
                $data['error']['type'] ?? 'unknown',
                $data['error']['message'] ?? 'Unknown OpenAI error.',
            ));
        }

        $text = trim((string) data_get($data, 'choices.0.message.content', ''));
        $usage = new Usage(
            (int) data_get($data, 'usage.prompt_tokens', 0),
            (int) data_get($data, 'usage.completion_tokens', 0),
        );
        $finishReason = $this->mapFinishReason((string) data_get($data, 'choices.0.finish_reason', 'stop'));
        $toolCalls = $this->extractToolCallsFromChatCompletions($data);

        if ($schema !== null) {
            return (new StructuredTextResponse(
                json_decode($text, true) ?? [],
                $text,
                $usage,
                new Meta($provider->name(), $model),
            ))->withToolCallsAndResults(
                toolCalls: new Collection($toolCalls),
                toolResults: new Collection,
            )->withSteps(new Collection([
                new Step(
                    $text,
                    $toolCalls,
                    [],
                    $finishReason,
                    $usage,
                    new Meta($provider->name(), $model),
                ),
            ]));
        }

        $responseText = new TextResponse(
            $text,
            $usage,
            new Meta($provider->name(), $model),
        );

        return $responseText->withMessages(new Collection)->withToolCallsAndResults(
            new Collection($toolCalls),
            new Collection,
        )->withSteps(new Collection([
            new Step(
                $text,
                $toolCalls,
                [],
                $finishReason,
                $usage,
                new Meta($provider->name(), $model),
            ),
        ]));
    }

    protected function mapMessagesToChatMessages(array $messages, ?string $instructions): array
    {
        $chatMessages = [];

        if ($instructions !== null && $instructions !== '') {
            $chatMessages[] = [
                'role' => 'system',
                'content' => $instructions,
            ];
        }

        foreach ($messages as $message) {
            $content = $this->mapMessageContent($message);

            $chatMessages[] = [
                'role' => $message->role->value,
                'content' => $content,
            ];
        }

        return $chatMessages;
    }

    protected function mapToolsForChatCompletions(array $tools): array
    {
        return array_map(fn ($tool) => [
            'type' => 'function',
            'function' => [
                'name' => $tool->name(),
                'description' => $tool->description(),
                'parameters' => [
                    'type' => 'object',
                    'properties' => $this->mapSchemaProperties($tool->schema(new JsonSchemaTypeFactory)),
                    'required' => array_keys($tool->schema(new JsonSchemaTypeFactory)),
                    'additionalProperties' => false,
                ],
            ],
        ], $tools);
    }

    protected function mapSchemaProperties(array $schema): array
    {
        $properties = [];

        foreach ($schema as $name => $type) {
            $properties[$name] = $this->mapTypeToSchema($type);
        }

        return $properties;
    }

    protected function mapTypeToSchema(Type $type): array
    {
        return match (true) {
            $type instanceof StringType => ['type' => 'string'],
            $type instanceof BooleanType => ['type' => 'boolean'],
            $type instanceof IntegerType => ['type' => 'integer'],
            $type instanceof NumberType => ['type' => 'number'],
            $type instanceof ArrayType => $this->mapArrayTypeToSchema($type),
            $type instanceof ObjectType => $this->mapObjectTypeToSchema($type),
            default => ['type' => 'string'],
        };
    }

    protected function mapObjectTypeToSchema(ObjectType $type): array
    {
        $properties = (fn () => $this->properties)->call($type);
        $additionalProperties = (fn () => $this->additionalProperties)->call($type);

        return [
            'type' => 'object',
            'properties' => $this->mapSchemaProperties($properties),
            'required' => array_keys($properties),
            'additionalProperties' => $additionalProperties ?? false,
        ];
    }

    protected function mapArrayTypeToSchema(ArrayType $type): array
    {
        $items = (fn () => $this->items)->call($type);

        return [
            'type' => 'array',
            'items' => $items instanceof Type ? $this->mapTypeToSchema($items) : ['type' => 'string'],
        ];
    }

    protected function extractToolCallsFromChatCompletions(array $data): array
    {
        $toolCalls = data_get($data, 'choices.0.message.tool_calls', []);

        return array_map(fn (array $toolCall) => new ToolCall(
            $toolCall['id'] ?? '',
            $toolCall['function']['name'] ?? '',
            json_decode($toolCall['function']['arguments'] ?? '{}', true) ?? [],
            null,
            null,
            null,
        ), $toolCalls);
    }

    protected function mapMessageContent(object $message): string
    {
        if (property_exists($message, 'content') && is_string($message->content)) {
            return $message->content;
        }

        return '';
    }

    protected function mapFinishReason(string $finishReason): FinishReason
    {
        return match ($finishReason) {
            'stop' => FinishReason::Stop,
            'length' => FinishReason::Length,
            'tool_calls' => FinishReason::ToolCalls,
            'content_filter' => FinishReason::ContentFilter,
            default => FinishReason::Unknown,
        };
    }
}
