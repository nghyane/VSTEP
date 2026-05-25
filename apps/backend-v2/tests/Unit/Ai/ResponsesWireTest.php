<?php

declare(strict_types=1);

namespace Tests\Unit\Ai;

use App\Ai\Wire\ResponsesWire;
use App\Ai\Wire\WireRequest;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class ResponsesWireTest extends TestCase
{
    public function test_sends_text_request(): void
    {
        Http::fake([
            '*/v1/responses' => Http::response([
                'output' => [[
                    'type' => 'message',
                    'content' => [['type' => 'output_text', 'text' => 'Hello']],
                ]],
                'usage' => ['input_tokens' => 10, 'output_tokens' => 5],
                'model' => 'gpt-5.4-mini',
            ]),
        ]);

        $wire = new ResponsesWire;
        $request = new WireRequest(model: 'gpt-5.4-mini', prompt: 'Say hi');
        $response = $wire->send(Http::baseUrl('https://example.com'), $request);

        $this->assertSame('Hello', $response->text);
        $this->assertNull($response->structured);
        $this->assertSame(10, $response->usage['input_tokens']);
        $this->assertSame(5, $response->usage['output_tokens']);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return $body['model'] === 'gpt-5.4-mini'
                && $body['input'][0]['content'] === 'Say hi'
                && ! isset($body['reasoning']);
        });
    }

    public function test_sends_structured_request_with_schema(): void
    {
        Http::fake([
            '*/v1/responses' => Http::response([
                'output' => [[
                    'type' => 'message',
                    'content' => [['type' => 'output_text', 'text' => '{"score":3}']],
                ]],
                'usage' => ['input_tokens' => 15, 'output_tokens' => 8],
                'model' => 'gpt-5.4',
            ]),
        ]);

        $wire = new ResponsesWire;
        $request = new WireRequest(
            model: 'gpt-5.4',
            prompt: 'Grade this',
            schema: ['score' => ['type' => 'number']],
            instructions: 'You are a grader.',
        );
        $response = $wire->send(Http::baseUrl('https://example.com'), $request);

        $this->assertSame(['score' => 3], $response->structured);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return isset($body['text']['format'])
                && $body['text']['format']['type'] === 'json_schema'
                && $body['input'][0]['role'] === 'developer';
        });
    }

    public function test_includes_reasoning_when_thinking_enabled(): void
    {
        Http::fake([
            '*/v1/responses' => Http::response([
                'output' => [[
                    'type' => 'message',
                    'content' => [['type' => 'output_text', 'text' => 'result']],
                ]],
                'usage' => ['input_tokens' => 10, 'output_tokens' => 5],
            ]),
        ]);

        $wire = new ResponsesWire;
        $request = new WireRequest(model: 'gpt-5.4', prompt: 'Think', thinking: 'high');
        $wire->send(Http::baseUrl('https://example.com'), $request);

        Http::assertSent(function (Request $r) {
            $body = $r->data();

            return ($body['reasoning']['effort'] ?? null) === 'high';
        });
    }
}
