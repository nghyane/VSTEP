<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

use App\Models\Exam;
use App\Models\ExamVersion;
use App\Models\ExamVersionListeningSection;
use App\Support\ReferenceExamListeningAudio;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ReferenceExamListeningAudioCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_generates_uploads_and_links_reference_exam_listening_audio(): void
    {
        config()->set('filesystems.disks.s3.bucket', 'test-bucket');
        Storage::fake('s3');

        $exam = Exam::factory()->create([
            'slug' => 'vstep-de-thi-thu-99-audio',
            'source_school' => 'Capstone VSTEP · Biên soạn theo cấu trúc VSTEP 3-5',
        ]);
        $version = ExamVersion::factory()->create([
            'exam_id' => $exam->id,
            'is_active' => true,
        ]);
        $section = ExamVersionListeningSection::create([
            'exam_version_id' => $version->id,
            'part' => 2,
            'part_title' => 'Part 2 · Test Dialogue',
            'duration_minutes' => 4,
            'transcript' => "Mai: Hello.\nAn: Hi there.",
            'display_order' => 1,
        ]);

        $ttsScript = $this->ttsScript();

        $this->artisan('reference-exams:generate-listening-audio', [
            '--python' => PHP_BINARY,
            '--script' => $ttsScript,
        ])->assertSuccessful();

        $key = ReferenceExamListeningAudio::key($exam->slug, 2, 1);
        Storage::disk('s3')->assertExists($key);
        $this->assertSame('sample-mp3', Storage::disk('s3')->get($key));
        $this->assertSame(ReferenceExamListeningAudio::publicUrl($key), $section->fresh()->audio_url);
    }

    private function ttsScript(): string
    {
        $path = storage_path('app/reference-tts-stub.php');
        file_put_contents($path, <<<'PHP'
<?php
declare(strict_types=1);

$outputIndex = array_search('--output', $argv, true);
if ($outputIndex === false || ! isset($argv[$outputIndex + 1])) {
    fwrite(STDERR, 'Missing --output');
    exit(1);
}

file_put_contents($argv[$outputIndex + 1], 'sample-mp3');
PHP);

        return $path;
    }
}
