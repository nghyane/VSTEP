<?php

declare(strict_types=1);

namespace Tests\Unit\Grading;

use App\Services\SpeechToTextService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use ReflectionMethod;
use Tests\TestCase;

final class SpeechToTextServiceTest extends TestCase
{
    public function test_azure_pronunciation_request_uses_standard_header(): void
    {
        config()->set('services.azure_speech.key', 'test-key');
        config()->set('services.azure_speech.region', 'southeastasia');

        $captured = null;
        Http::fake(function (Request $request) use (&$captured) {
            $captured = $request;

            return Http::response([
                'Duration' => 10_000_000,
                'DisplayText' => 'Hello.',
                'NBest' => [[
                    'Confidence' => 0.9,
                    'AccuracyScore' => 90.0,
                    'FluencyScore' => 90.0,
                    'ProsodyScore' => 90.0,
                    'CompletenessScore' => 90.0,
                    'PronScore' => 90.0,
                    'Words' => [['Word' => 'hello', 'Offset' => 0, 'Duration' => 10_000_000]],
                ]],
            ]);
        });

        $result = (new SpeechToTextService)->transcribe('audio-bytes', 'en-US', 'audio/wav');

        $this->assertSame(9.0, $result['pronunciation']['overall']);
        $this->assertInstanceOf(Request::class, $captured);

        $header = $captured->header('Pronunciation-Assessment')[0] ?? '';
        $payload = json_decode((string) base64_decode($header, true), true);

        $this->assertSame('HundredMark', $payload['GradingSystem']);
        $this->assertSame('Word', $payload['Granularity']);
        $this->assertSame('Comprehensive', $payload['Dimension']);
        $this->assertTrue($payload['EnableMiscue']);
        $this->assertTrue($payload['EnableProsodyAssessment']);
    }

    public function test_azure_pronunciation_scores_use_hundred_mark_scale(): void
    {
        $result = $this->parseAzureResponse([
            'Duration' => 10_000_000,
            'DisplayText' => 'Good morning.',
            'NBest' => [[
                'Confidence' => 0.98,
                'AccuracyScore' => 82.0,
                'FluencyScore' => 74.0,
                'ProsodyScore' => 91.0,
                'CompletenessScore' => 88.0,
                'PronScore' => 84.0,
                'Words' => [
                    [
                        'Word' => 'good',
                        'Offset' => 0,
                        'Duration' => 2_000_000,
                        'AccuracyScore' => 55.0,
                        'ErrorType' => 'Mispronunciation',
                        'Feedback' => [
                            'Prosody' => [
                                'Break' => ['ErrorTypes' => ['UnexpectedBreak']],
                                'Intonation' => ['ErrorTypes' => ['Monotone']],
                            ],
                        ],
                    ],
                    [
                        'Word' => 'morning',
                        'Offset' => 4_500_000,
                        'Duration' => 3_000_000,
                        'AccuracyScore' => 92.0,
                        'ErrorType' => 'None',
                        'Feedback' => [
                            'Prosody' => [
                                'Break' => ['ErrorTypes' => ['MissingBreak']],
                                'Intonation' => ['ErrorTypes' => []],
                            ],
                        ],
                    ],
                ],
            ]],
        ]);

        $this->assertSame('Good morning.', $result['text']);
        $this->assertSame(0.98, $result['confidence']);
        $this->assertSame(1000, $result['duration_ms']);
        $this->assertSame(2, $result['word_count']);
        $this->assertSame(1, $result['pause_count']);
        $this->assertSame(120.0, $result['speaking_rate']);
        $this->assertSame([
            'accuracy' => 8.2,
            'fluency' => 7.4,
            'prosody' => 9.1,
            'completeness' => 8.8,
            'overall' => 8.4,
            'mispronunciation_count' => 1,
            'unexpected_break_count' => 1,
            'missing_break_count' => 1,
            'monotone_count' => 1,
            'low_accuracy_words' => [[
                'word' => 'good',
                'accuracy' => 5.5,
                'error_type' => 'Mispronunciation',
            ]],
        ], $result['pronunciation']);
    }

    /** @param array<string,mixed> $data @return array<string,mixed> */
    private function parseAzureResponse(array $data): array
    {
        $method = new ReflectionMethod(SpeechToTextService::class, 'parseAzureResponse');
        $method->setAccessible(true);

        return $method->invoke(new SpeechToTextService, $data);
    }
}
