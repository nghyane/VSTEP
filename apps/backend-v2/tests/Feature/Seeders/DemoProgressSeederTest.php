<?php

declare(strict_types=1);

namespace Tests\Feature\Seeders;

use App\Enums\ExamSessionStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentJob;
use App\Models\AssessmentResult;
use App\Models\ExamMcqAnswer;
use App\Models\ExamSession;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersionListeningItem;
use App\Models\ExamVersionReadingItem;
use App\Models\ExamWritingSubmission;
use App\Models\PracticeVocabExerciseAttempt;
use App\Models\PracticeVocabReview;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use Database\Seeders\AssessmentRubricSeeder;
use Database\Seeders\DemoAccountSeeder;
use Database\Seeders\DemoProgressSeeder;
use Database\Seeders\ReferenceExamSeeder;
use Database\Seeders\SystemConfigSeeder;
use Database\Seeders\VocabCurriculumSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class DemoProgressSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_exam_progress_matches_real_exam_history_and_scoring_shape(): void
    {
        config()->set('filesystems.disks.s3.bucket', '');

        $this->seed(SystemConfigSeeder::class);
        $this->seed(AssessmentRubricSeeder::class);
        $this->seed(ReferenceExamSeeder::class);
        $this->seed(VocabCurriculumSeeder::class);
        $topic = VocabTopic::query()->where('is_published', true)->firstOrFail();
        VocabExercise::factory()->count(4)->mcq(correctIndex: 2)->create(['topic_id' => $topic->id]);
        $this->seed(DemoAccountSeeder::class);
        $this->seed(DemoProgressSeeder::class);

        $profile = Profile::query()->where('nickname', 'Minh')->firstOrFail();
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('status', ExamSessionStatus::Submitted)
            ->with('examVersion')
            ->get();

        $this->assertCount(6, $sessions);
        $this->assertSame(6, $sessions->pluck('exam_version_id')->unique()->count());

        foreach ($sessions as $session) {
            $this->assertSame(2, ExamWritingSubmission::query()->where('session_id', $session->id)->count());
            $this->assertSame(3, ExamSpeakingSubmission::query()->where('session_id', $session->id)->count());
            $this->assertGreaterThan(0, ExamMcqAnswer::query()->where('session_id', $session->id)->count());
        }

        $attemptCount = AssessmentAttempt::query()->where('profile_id', $profile->id)->count();
        $this->assertSame(30, $attemptCount);
        $this->assertSame($attemptCount, AssessmentJob::query()->whereHas('attempt', fn ($query) => $query->where('profile_id', $profile->id))->count());
        $this->assertSame($attemptCount, AssessmentResult::query()->whereHas('attempt', fn ($query) => $query->where('profile_id', $profile->id))->count());

        $answer = ExamMcqAnswer::query()->where('session_id', $sessions->firstOrFail()->id)->firstOrFail();
        $correctIndex = $answer->item_ref_type === 'exam_listening_item'
            ? ExamVersionListeningItem::query()->whereKey($answer->item_ref_id)->value('correct_index')
            : ExamVersionReadingItem::query()->whereKey($answer->item_ref_id)->value('correct_index');

        $this->assertSame((int) $answer->selected_index === (int) $correctIndex, (bool) $answer->is_correct);
        $this->assertGreaterThanOrEqual(60, PracticeVocabReview::query()->where('profile_id', $profile->id)->count());
        $this->assertSame(8, PracticeVocabExerciseAttempt::query()->where('profile_id', $profile->id)->count());
        $this->assertGreaterThanOrEqual(60, ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)
            ->sum('vocab_review_count'));
    }
}
