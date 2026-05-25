<?php

declare(strict_types=1);

namespace Tests\Unit\Ai;

use App\Ai\Wire\MessagesWire;
use App\Ai\Wire\WireRequest;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class MessagesWireTest extends TestCase
{
    public function test_sends_text_request_with_thinking_disabled(): void
    {
        Http::fake([
            '*/v1/messages' => Http::response([
                'content' => [['type' => 'text', 'text' => 'Hello']],
                'usage' => ['input_tokens' => 10, 'output_tokens' => 3],
                'model' => 'deepseek-v4-flash',
            ]),
        ]);

        $wire = new MessagesWire;
        $request = new WireRequest(model: 'deepseek-v4-flash', prompt: 'Say hi');
        $response = $wire->send(Http::baseUrl('https://x.com'), $request);

        $this->assertSame('Hello', $response->text);
        $this->assertNull($response->structured);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return $body['thinking']['type'] === 'disabled'
                && ! isset($body['tools']);
        });
    }

    public function test_structured_uses_tool_call(): void
    {
        Http::fake([
            '*/v1/messages' => Http::response([
                'content' => [[
                    'type' => 'tool_use',
                    'name' => 'structured_output',
                    'input' => ['score' => 3.0],
                ]],
                'usage' => ['input_tokens' => 20, 'output_tokens' => 10],
            ]),
        ]);

        $wire = new MessagesWire;
        $request = new WireRequest(
            model: 'deepseek-v4-pro',
            prompt: 'Grade',
            schema: ['score' => ['type' => 'number']],
        );
        $response = $wire->send(Http::baseUrl('https://x.com'), $request);

        $this->assertEquals(['score' => 3.0], $response->structured);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return isset($body['tools'][0]['name'])
                && $body['tools'][0]['name'] === 'structured_output'
                && $body['tool_choice']['type'] === 'tool';
        });
    }

    public function test_thinking_enabled_uses_tool_choice_any(): void
    {
        Http::fake([
            '*/v1/messages' => Http::response([
                'content' => [
                    ['type' => 'thinking', 'thinking' => 'reasoning...'],
                    ['type' => 'tool_use', 'name' => 'structured_output', 'input' => ['x' => 1]],
                ],
                'usage' => ['input_tokens' => 30, 'output_tokens' => 15],
            ]),
        ]);

        $wire = new MessagesWire;
        $request = new WireRequest(
            model: 'deepseek-v4-pro',
            prompt: 'Think and grade',
            schema: ['x' => ['type' => 'number']],
            thinking: 'low',
        );
        $response = $wire->send(Http::baseUrl('https://x.com'), $request);

        $this->assertSame(['x' => 1], $response->structured);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return $body['thinking']['type'] === 'enabled'
                && $body['thinking']['budget_tokens'] === 1024
                && $body['tool_choice']['type'] === 'any';
        });
    }
}
