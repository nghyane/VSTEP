<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

use App\Enums\ExamSessionStatus;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Services\ExamVersionValidator;
use App\Support\ReferenceExamListeningAudio;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceExamSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

final class ReferenceExamSeederTest extends TestCase
{
    use RefreshDatabase;

    private const REFERENCE_SLUGS = [
        'vstep-de-thi-thu-01-doi-song-sinh-vien',
        'vstep-de-thi-thu-02-thuc-tap-cong-so',
        'vstep-de-thi-thu-03-doi-song-do-thi',
        'vstep-de-thi-thu-04-hoc-tap-dai-hoc',
        'vstep-de-thi-thu-05-thanh-pho-ben-vung',
        'vstep-de-thi-thu-06-cong-so-so',
        'vstep-de-thi-thu-07-suc-khoe-cong-dong',
        'vstep-de-thi-thu-08-du-lich-di-san',
        'vstep-de-thi-thu-09-cong-nghe-giao-duc',
        'vstep-de-thi-thu-10-moi-truong-tieu-dung',
    ];

    public function test_reference_exam_seeder_publishes_ten_prod_like_full_tests(): void
    {
        config()->set('filesystems.disks.s3.bucket', '');

        $this->seed(ContentSeeder::class);
        $this->seed(ReferenceExamSeeder::class);

        $this->assertSame(10, Exam::query()->where('is_published', true)->count());
        $this->assertSame(10, Exam::query()->whereIn('slug', self::REFERENCE_SLUGS)->count());
        $this->assertSame(0, Exam::query()
            ->whereIn('slug', ['vstep-demo-1', 'vstep-practice-2', 'vstep-practice-3'])
            ->where('is_published', true)
            ->count());
        $this->assertSame(10, ExamVersion::query()
            ->where('is_active', true)
            ->whereHas('exam', fn ($query) => $query->where('is_published', true))
            ->count());
        $exam = Exam::query()
            ->where('slug', 'vstep-de-thi-thu-10-moi-truong-tieu-dung')
            ->firstOrFail();

        $this->assertSame('Đề 10 · Môi trường & tiêu dùng', $exam->title);
        $this->assertSame('Capstone VSTEP · Biên soạn theo cấu trúc VSTEP 3-5', $exam->source_school);
        $this->assertSame(['Môi trường', 'Tiêu dùng bền vững'], $exam->tags);

        $version = $exam
            ->versions()
            ->where('is_active', true)
            ->with(['listeningSections.items', 'readingPassages.items', 'writingTasks', 'speakingParts'])
            ->firstOrFail();

        $this->assertSame(14, $version->listeningSections->count());
        $this->assertSame(35, $version->listeningSections->sum(fn ($section): int => $section->items->count()));
        $this->assertSame(4, $version->readingPassages->count());
        $this->assertSame(40, $version->readingPassages->sum(fn ($passage): int => $passage->items->count()));
        $this->assertSame(2, $version->writingTasks->count());
        $this->assertSame(3, $version->speakingParts->count());
    }

    public function test_reference_exam_versions_follow_official_vstep_shape(): void
    {
        config()->set('filesystems.disks.s3.bucket', '');

        $this->seed(ReferenceExamSeeder::class);

        $validator = app(ExamVersionValidator::class);
        $exams = Exam::query()
            ->whereIn('slug', self::REFERENCE_SLUGS)
            ->with(['versions' => fn ($query) => $query
                ->where('is_active', true)
                ->with(['listeningSections.items', 'readingPassages.items', 'writingTasks', 'speakingParts'])])
            ->get();

        $this->assertCount(10, $exams);

        foreach ($exams as $exam) {
            $version = $exam->versions->firstOrFail();
            $errors = $validator->validateOfficialFixtureData(
                $version->listeningSections,
                $version->listeningSections->flatMap(fn ($section) => $section->items)->groupBy('section_id'),
                $version->readingPassages,
                $version->readingPassages->flatMap(fn ($passage) => $passage->items)->groupBy('passage_id'),
                $version->writingTasks,
                $version->speakingParts,
            );

            $this->assertSame([], $errors, $exam->slug.': '.implode(' ', $errors));
        }
    }

    public function test_reference_exam_seeder_is_idempotent_when_content_is_unchanged(): void
    {
        config()->set('filesystems.disks.s3.bucket', '');

        $this->seed(ReferenceExamSeeder::class);
        $firstVersionIds = ExamVersion::query()->orderBy('exam_id')->orderBy('version_number')->pluck('id')->all();

        $this->seed(ReferenceExamSeeder::class);

        $this->assertSame(10, Exam::query()->whereIn('slug', self::REFERENCE_SLUGS)->count());
        $this->assertSame(10, ExamVersion::query()->count());
        $this->assertSame($firstVersionIds, ExamVersion::query()->orderBy('exam_id')->orderBy('version_number')->pluck('id')->all());
    }

    public function test_reference_exam_seeder_links_existing_r2_listening_audio(): void
    {
        config()->set('filesystems.disks.s3.bucket', 'test-bucket');
        Storage::fake('s3');

        $key = ReferenceExamListeningAudio::key('vstep-de-thi-thu-01-doi-song-sinh-vien', 1, 1);
        Storage::disk('s3')->put($key, 'audio');

        $this->seed(ReferenceExamSeeder::class);

        $section = Exam::query()
            ->where('slug', 'vstep-de-thi-thu-01-doi-song-sinh-vien')
            ->firstOrFail()
            ->versions()
            ->where('is_active', true)
            ->firstOrFail()
            ->listeningSections()
            ->where('part', 1)
            ->orderBy('display_order')
            ->firstOrFail();

        $this->assertSame(ReferenceExamListeningAudio::publicUrl($key), $section->audio_url);
    }

    public function test_reference_exam_seeder_preserves_existing_sessions_when_syncing_exam(): void
    {
        config()->set('filesystems.disks.s3.bucket', '');

        $exam = Exam::factory()->create([
            'slug' => 'vstep-de-thi-thu-01-doi-song-sinh-vien',
            'title' => 'Old title',
            'source_school' => 'Capstone VSTEP · Biên soạn theo cấu trúc VSTEP 3-5',
        ]);
        $version = ExamVersion::factory()->create([
            'exam_id' => $exam->id,
            'is_active' => true,
        ]);
        $session = ExamSession::create([
            'profile_id' => Profile::factory()->create()->id,
            'exam_version_id' => $version->id,
            'mode' => 'full',
            'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
            'is_full_test' => true,
            'started_at' => now(),
            'server_deadline_at' => now()->addHours(2),
            'submitted_at' => null,
            'status' => ExamSessionStatus::Active,
            'coins_charged' => 0,
        ]);

        $this->seed(ReferenceExamSeeder::class);

        $freshExam = Exam::query()->where('slug', 'vstep-de-thi-thu-01-doi-song-sinh-vien')->firstOrFail();
        $this->assertSame($exam->id, $freshExam->id);
        $this->assertSame('Đề 01 · Đời sống sinh viên', $freshExam->title);
        $this->assertDatabaseHas('exam_sessions', ['id' => $session->id]);
        $this->assertSame(2, $freshExam->versions()->count());
        $this->assertFalse((bool) $version->fresh()->is_active);
    }
}
