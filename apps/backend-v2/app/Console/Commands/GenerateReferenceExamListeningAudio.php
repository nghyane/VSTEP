<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Exam;
use App\Models\ExamVersionListeningSection;
use App\Support\ReferenceExamListeningAudio;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToCheckFileExistence;

final class GenerateReferenceExamListeningAudio extends Command
{
    private const SOURCE_SCHOOL = 'Capstone VSTEP · Biên soạn theo cấu trúc VSTEP 3-5';

    protected $signature = 'reference-exams:generate-listening-audio
        {--slug=* : Only generate audio for selected exam slug(s)}
        {--force : Regenerate and upload even when the R2 object already exists}
        {--dry-run : Print planned R2 keys without generating or uploading}
        {--python=python3 : Python executable used for the TTS script}
        {--script= : Path to the Python TTS script}
        {--voice-part1=en-US-JennyNeural : Voice for Listening Part 1 notices}
        {--voice-part2=en-US-JennyNeural,en-US-GuyNeural,en-GB-SoniaNeural,en-GB-RyanNeural : Comma-separated dialogue voices for Listening Part 2}
        {--voice-part3=en-US-AriaNeural : Voice for Listening Part 3 talks}
        {--rate=+0% : Edge TTS speech rate, e.g. +0%, -5%, +10%}';

    protected $description = 'Generate reference exam listening audio with Python TTS and upload it to R2';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $script = $this->scriptPath();

        if (! $dryRun) {
            $this->ensureStorageConfigured();

            if (! is_file($script)) {
                $this->error("TTS script not found: {$script}");

                return self::FAILURE;
            }
        }

        $sections = $this->sections();
        if ($sections->isEmpty()) {
            $this->error('No reference exam listening sections found. Run ReferenceExamSeeder first.');

            return self::FAILURE;
        }

        $generated = 0;
        $uploaded = 0;
        $linked = 0;
        $force = (bool) $this->option('force');

        foreach ($sections as $entry) {
            $section = $entry['section'];
            $key = $entry['key'];
            $audioUrl = ReferenceExamListeningAudio::publicUrl($key);

            if ($dryRun) {
                $this->line("{$entry['exam_slug']} · Part {$section->part} · {$section->part_title} → {$key}");

                continue;
            }

            if (! $force && $this->storedAudioExists($key)) {
                $section->update(['audio_url' => $audioUrl]);
                $linked++;
                $this->line("Linked existing: {$key}");

                continue;
            }

            $audioPath = $this->generateAudio($script, $section, $entry['exam_slug']);
            $generated++;
            $audioContent = file_get_contents($audioPath);
            if ($audioContent === false) {
                throw new \RuntimeException("Cannot read generated audio: {$audioPath}");
            }

            $stored = Storage::disk('s3')->put($key, $audioContent, [
                'ContentType' => ReferenceExamListeningAudio::CONTENT_TYPE,
            ]);
            if (! $stored) {
                throw new \RuntimeException("Cannot upload generated audio to R2: {$key}");
            }

            $section->update(['audio_url' => $audioUrl]);
            @unlink($audioPath);
            $uploaded++;
            $this->info("Uploaded: {$key}");
        }

        $this->info("Reference listening audio synced. generated={$generated}, uploaded={$uploaded}, linked_existing={$linked}.");

        return self::SUCCESS;
    }

    private function storedAudioExists(string $key): bool
    {
        try {
            return Storage::disk('s3')->exists($key);
        } catch (UnableToCheckFileExistence) {
            return false;
        }
    }

    private function ensureStorageConfigured(): void
    {
        if ((string) config('filesystems.disks.s3.bucket') === '') {
            throw new \RuntimeException('AWS_BUCKET is required to upload reference exam audio.');
        }
    }

    private function scriptPath(): string
    {
        $script = (string) $this->option('script');
        if ($script !== '') {
            return $script;
        }

        return base_path('scripts/tts/reference_exam_audio.py');
    }

    /** @return Collection<int, array{exam_slug: string, section: ExamVersionListeningSection, key: string}> */
    private function sections(): Collection
    {
        $slugs = $this->option('slug');
        $slugFilter = is_array($slugs) ? array_filter($slugs, 'is_string') : [];

        return Exam::query()
            ->where('source_school', self::SOURCE_SCHOOL)
            ->when($slugFilter !== [], fn ($query) => $query->whereIn('slug', $slugFilter))
            ->with(['versions' => fn ($query) => $query
                ->where('is_active', true)
                ->with('listeningSections')])
            ->orderBy('slug')
            ->get()
            ->flatMap(function (Exam $exam): array {
                $version = $exam->versions->first();
                if ($version === null) {
                    return [];
                }

                $partSectionNumbers = [];

                return $version->listeningSections
                    ->sortBy(fn (ExamVersionListeningSection $section): string => sprintf('%d:%04d:%s', $section->part, $section->display_order, $section->id))
                    ->map(function (ExamVersionListeningSection $section) use ($exam, &$partSectionNumbers): array {
                        $part = (int) $section->part;
                        $partSectionNumbers[$part] = ($partSectionNumbers[$part] ?? 0) + 1;

                        return [
                            'exam_slug' => $exam->slug,
                            'section' => $section,
                            'key' => ReferenceExamListeningAudio::key($exam->slug, $part, $partSectionNumbers[$part]),
                        ];
                    })
                    ->all();
            })
            ->values();
    }

    private function generateAudio(string $script, ExamVersionListeningSection $section, string $examSlug): string
    {
        $transcript = trim((string) $section->transcript);
        if ($transcript === '') {
            throw new \RuntimeException("Missing transcript for {$examSlug} {$section->part_title}.");
        }

        $workDir = storage_path('app/reference-exam-tts');
        if (! is_dir($workDir) && ! mkdir($workDir, 0755, true) && ! is_dir($workDir)) {
            throw new \RuntimeException("Cannot create TTS work directory: {$workDir}");
        }

        $textPath = tempnam($workDir, 'transcript-');
        $audioPath = tempnam($workDir, 'audio-');
        if ($textPath === false || $audioPath === false) {
            throw new \RuntimeException('Cannot create temporary TTS files.');
        }

        file_put_contents($textPath, $transcript);

        $result = Process::timeout(180)->run([
            (string) $this->option('python'),
            $script,
            '--text-file',
            $textPath,
            '--output',
            $audioPath,
            '--part',
            (string) $section->part,
            '--voice-part1',
            (string) $this->option('voice-part1'),
            '--voice-part2',
            (string) $this->option('voice-part2'),
            '--voice-part3',
            (string) $this->option('voice-part3'),
            '--rate',
            (string) $this->option('rate'),
        ]);
        @unlink($textPath);

        if ($result->failed()) {
            @unlink($audioPath);
            throw new \RuntimeException(trim($result->errorOutput()) ?: trim($result->output()) ?: 'TTS generation failed.');
        }

        if (! is_file($audioPath) || filesize($audioPath) === 0) {
            @unlink($audioPath);
            throw new \RuntimeException('TTS script did not produce audio.');
        }

        return $audioPath;
    }
}
