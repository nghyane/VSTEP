<?php

declare(strict_types=1);

namespace Tests\Feature\Exam;

use App\Models\Exam;
use App\Models\ExamVersion;
use App\Services\ExamVersionValidator;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceExamSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class ReferenceExamSeederTest extends TestCase
{
    use RefreshDatabase;

    private const REFERENCE_SLUGS = [
        'vstep-mock-test-01-campus-orientation',
        'vstep-mock-test-02-work-internships',
        'vstep-mock-test-03-city-life-housing',
        'vstep-mock-test-04-campus-learning',
        'vstep-mock-test-05-sustainable-cities',
        'vstep-mock-test-06-digital-workplace',
        'vstep-mock-test-07-public-health',
        'vstep-mock-test-08-tourism-heritage',
        'vstep-mock-test-09-education-technology',
        'vstep-mock-test-10-environmental-action',
    ];

    public function test_reference_exam_seeder_publishes_ten_prod_like_full_tests(): void
    {
        $this->seed(ContentSeeder::class);
        $this->seed(ReferenceExamSeeder::class);

        $this->assertSame(13, Exam::query()->count());
        $this->assertSame(10, Exam::query()->where('is_published', true)->count());
        $this->assertSame(10, Exam::query()->whereIn('slug', self::REFERENCE_SLUGS)->count());
        $this->assertSame(10, ExamVersion::query()
            ->where('is_active', true)
            ->whereHas('exam', fn ($query) => $query->where('is_published', true))
            ->count());
        $this->assertSame(0, Exam::query()
            ->whereIn('slug', ['vstep-demo-1', 'vstep-practice-2', 'vstep-practice-3'])
            ->where('is_published', true)
            ->count());

        $exam = Exam::query()
            ->where('slug', 'vstep-mock-test-10-environmental-action')
            ->firstOrFail();

        $this->assertSame('VSTEP Mock Test 10: Environmental Action & Responsible Consumption', $exam->title);
        $this->assertSame(['Full Mock', 'B1-C1', 'Environment', 'Consumption'], $exam->tags);

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
}
