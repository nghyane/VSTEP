<?php

declare(strict_types=1);

namespace Tests\Unit\Ai;

use App\Ai\Wire\ChatCompletionsWire;
use App\Ai\Wire\WireRequest;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class ChatCompletionsWireTest extends TestCase
{
    public function test_sends_text_request(): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'Hi there']]],
                'usage' => ['prompt_tokens' => 8, 'completion_tokens' => 4],
                'model' => 'gpt-5.4-mini',
            ]),
        ]);

        $wire = new ChatCompletionsWire;
        $request = new WireRequest(model: 'gpt-5.4-mini', prompt: 'Say hi');
        $response = $wire->send(Http::baseUrl('https://x.com'), $request);

        $this->assertSame('Hi there', $response->text);
        $this->assertNull($response->structured);
        $this->assertSame(8, $response->usage['input_tokens']);
    }

    public function test_sends_structured_request(): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => '',
                        'tool_calls' => [[
                            'function' => [
                                'name' => 'grade_writing',
                                'arguments' => '{"grade":2.5}',
                            ],
                        ]],
                    ],
                ]],
                'usage' => ['prompt_tokens' => 12, 'completion_tokens' => 6],
            ]),
        ]);

        $wire = new ChatCompletionsWire;
        $request = new WireRequest(
            model: 'gpt-5-4',
            prompt: 'Grade',
            schema: ['grade' => ['type' => 'number']],
            toolName: 'grade_writing',
            toolDescription: 'Submit grading result',
        );
        $response = $wire->send(Http::baseUrl('https://x.com'), $request);

        $this->assertSame(['grade' => 2.5], $response->structured);

        Http::assertSent(fn (Request $r) => ! isset($r->data()['response_format']) && isset($r->data()['tools']));
    }

    public function test_includes_reasoning_effort(): void
    {
        Http::fake([
            '*/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'ok']]],
                'usage' => ['prompt_tokens' => 5, 'completion_tokens' => 2],
            ]),
        ]);

        $wire = new ChatCompletionsWire;
        $request = new WireRequest(model: 'test', prompt: 'x', thinking: 'medium');
        $wire->send(Http::baseUrl('https://x.com'), $request);

        Http::assertSent(fn (Request $r) => ($r->data()['reasoning_effort'] ?? null) === 'medium');
    }
}
