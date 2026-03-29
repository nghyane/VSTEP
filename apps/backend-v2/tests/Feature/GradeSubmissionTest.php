<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\KnowledgePointCategory;
use App\Enums\Level;
use App\Enums\NotificationType;
use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Enums\VstepBand;
use App\Jobs\GradeSubmission;
use App\Models\GradingCriterion;
use App\Models\GradingRubric;
use App\Models\KnowledgePoint;
use App\Models\Notification;
use App\Models\PracticeSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ProgressService;
use App\Services\PronunciationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GradeSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Question $question;

    private GradingRubric $rubric;

    private array $knowledgePoints;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'full_name' => 'Test Student',
            'email' => 'test@example.com',
            'password' => 'password',
            'role' => 'learner',
        ]);

        $this->knowledgePoints = $this->seedKnowledgePoints();
        $this->question = $this->seedQuestion();
        $this->rubric = $this->seedRubric();
    }

    #[Test]
    public function it_grades_writing_submission_happy_path(): void
    {
        $submission = $this->createSubmission();

        $this->runGradeJob($submission, [
            'criteria_scores' => [
                'task_fulfillment' => 7.3,
                'organization' => 8.0,
                'vocabulary' => 6.7,
                'grammar' => 7.0,
            ],
            'feedback' => 'Bài viết tốt, cần cải thiện từ vựng.',
            'knowledge_gaps' => ['Subject-Verb Agreement'],
            'confidence' => 'high',
        ]);

        $submission->refresh();

        $this->assertSame(SubmissionStatus::Completed, $submission->status);
        // Normalized: 7.5, 8.0, 6.5, 7.0 → avg 7.25 → VSTEP round 7.5
        $this->assertSame(7.5, $submission->score);
        $this->assertSame(VstepBand::B2, $submission->band);
        $this->assertSame('Bài viết tốt, cần cải thiện từ vựng.', $submission->feedback);
        $this->assertNotNull($submission->completed_at);

        // Result structure
        $this->assertSame('ai_agent', $submission->result['type']);
        $this->assertCount(4, $submission->result['criteria']);
        $this->assertSame('high', $submission->result['confidence']);

        // Criteria enriched with names and normalized scores
        $criteria = collect($submission->result['criteria']);
        $tf = $criteria->firstWhere('key', 'task_fulfillment');
        $this->assertSame('Task Fulfillment', $tf['name']);
        $this->assertSame(7.5, $tf['score']); // 7.3 → 7.5

        $vocab = $criteria->firstWhere('key', 'vocabulary');
        $this->assertSame(6.5, $vocab['score']); // 6.7 → 6.5

        // Knowledge gaps enriched with path
        $this->assertNotEmpty($submission->result['knowledge_gaps']);
        $gap = $submission->result['knowledge_gaps'][0];
        $this->assertSame('Subject-Verb Agreement', $gap['name']);
        $this->assertSame('grammar', $gap['category']);
        $this->assertIsArray($gap['path']);

        // Notification sent
        $notification = Notification::where('user_id', $this->user->id)
            ->where('type', NotificationType::GradingComplete)
            ->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('7.5/10', $notification->body);
    }

    #[Test]
    public function it_sets_review_pending_for_low_confidence(): void
    {
        $submission = $this->createSubmission();

        $this->runGradeJob($submission, [
            'criteria_scores' => [
                'task_fulfillment' => 5.0,
                'organization' => 5.0,
                'vocabulary' => 5.0,
                'grammar' => 5.0,
            ],
            'feedback' => 'Bài viết quá ngắn.',
            'knowledge_gaps' => [],
            'confidence' => 'low',
        ]);

        $submission->refresh();

        $this->assertSame(SubmissionStatus::ReviewPending, $submission->status);
        $this->assertSame(5.0, $submission->score);
        $this->assertNull($submission->completed_at);

        $notification = Notification::where('user_id', $this->user->id)
            ->where('type', NotificationType::GradingComplete)
            ->latest()
            ->first();
        $this->assertStringContainsString('chờ review', $notification->body);
    }

    #[Test]
    public function it_skips_already_claimed_submission(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::Processing);

        $job = new GradeSubmission($submission->id);
        $job->handle(
            app(ProgressService::class),
            app(NotificationService::class),
            app(PronunciationService::class),
        );

        $submission->refresh();

        $this->assertSame(SubmissionStatus::Processing, $submission->status);
        $this->assertNull($submission->score);
        $this->assertSame(0, Notification::count());
    }

    #[Test]
    public function it_skips_completed_submission(): void
    {
        $submission = $this->createSubmission(SubmissionStatus::Completed);

        $job = new GradeSubmission($submission->id);
        $job->handle(
            app(ProgressService::class),
            app(NotificationService::class),
            app(PronunciationService::class),
        );

        $submission->refresh();
        $this->assertSame(SubmissionStatus::Completed, $submission->status);
        $this->assertSame(0, Notification::count());
    }

    #[Test]
    public function it_marks_failed_on_exception(): void
    {
        $submission = $this->createSubmission();

        $job = $this->createJobWithMockedAgent($submission->id, [
            'criteria_scores' => ['task_fulfillment' => 7.0],
            'feedback' => 'Feedback.',
            'knowledge_gaps' => [],
            'confidence' => 'high',
        ]);

        try {
            $job->handle(
                app(ProgressService::class),
                app(NotificationService::class),
                app(PronunciationService::class),
            );
            $this->fail('Expected RuntimeException for missing criteria.');
        } catch (\RuntimeException) {
            // Expected — agent returned incomplete criteria
        }

        $job->failed(new \RuntimeException('Agent missing criteria'));

        $submission->refresh();
        $this->assertSame(SubmissionStatus::Failed, $submission->status);

        $notification = Notification::where('user_id', $this->user->id)
            ->where('type', NotificationType::System)
            ->first();
        $this->assertNotNull($notification);
        $this->assertStringContainsString('không thể chấm', $notification->body);
    }

    #[Test]
    public function it_filters_invalid_knowledge_gaps(): void
    {
        $submission = $this->createSubmission();

        $this->runGradeJob($submission, [
            'criteria_scores' => [
                'task_fulfillment' => 7.0,
                'organization' => 7.0,
                'vocabulary' => 7.0,
                'grammar' => 7.0,
            ],
            'feedback' => 'Good essay.',
            'knowledge_gaps' => ['Subject-Verb Agreement', 'Nonexistent Topic', 'Fake Gap'],
            'confidence' => 'high',
        ]);

        $submission->refresh();

        $gapNames = collect($submission->result['knowledge_gaps'])->pluck('name')->toArray();
        $this->assertContains('Subject-Verb Agreement', $gapNames);
        $this->assertNotContains('Nonexistent Topic', $gapNames);
        $this->assertNotContains('Fake Gap', $gapNames);
    }

    #[Test]
    public function it_calculates_weighted_overall_correctly(): void
    {
        $submission = $this->createSubmission();

        // With unequal weights: tf=0.4, org=0.2, vocab=0.2, grammar=0.2
        $this->rubric->criteria()->delete();
        $this->seedCriteria($this->rubric, [
            ['key' => 'task_fulfillment', 'name' => 'Task Fulfillment', 'weight' => 0.4, 'sort_order' => 1],
            ['key' => 'organization', 'name' => 'Organization', 'weight' => 0.2, 'sort_order' => 2],
            ['key' => 'vocabulary', 'name' => 'Vocabulary', 'weight' => 0.2, 'sort_order' => 3],
            ['key' => 'grammar', 'name' => 'Grammar', 'weight' => 0.2, 'sort_order' => 4],
        ]);

        $this->runGradeJob($submission, [
            'criteria_scores' => [
                'task_fulfillment' => 10.0,
                'organization' => 5.0,
                'vocabulary' => 5.0,
                'grammar' => 5.0,
            ],
            'feedback' => 'Great task fulfillment.',
            'knowledge_gaps' => [],
            'confidence' => 'high',
        ]);

        $submission->refresh();

        // Weighted: (10*0.4 + 5*0.2 + 5*0.2 + 5*0.2) / (0.4+0.2+0.2+0.2) = 7.0
        $this->assertSame(7.0, $submission->score);
    }

    #[Test]
    public function it_persists_scaffolding_type_in_practice_grading_result(): void
    {
        $practiceSession = PracticeSession::create([
            'user_id' => $this->user->id,
            'skill' => Skill::Writing,
            'mode' => 'guided',
            'level' => Level::B2,
            'config' => ['items_count' => 3],
            'started_at' => now(),
        ]);

        $submission = Submission::create([
            'user_id' => $this->user->id,
            'practice_session_id' => $practiceSession->id,
            'question_id' => $this->question->id,
            'skill' => Skill::Writing,
            'answer' => ['text' => 'This is a guided writing response.'],
            'status' => SubmissionStatus::Pending,
        ]);

        $this->runGradeJob($submission, [
            'criteria_scores' => [
                'task_fulfillment' => 7.0,
                'organization' => 7.0,
                'vocabulary' => 7.0,
                'grammar' => 7.0,
            ],
            'feedback' => 'Structured response.',
            'knowledge_gaps' => [],
            'confidence' => 'high',
        ]);

        $submission->refresh();

        $this->assertSame('guided', $submission->result['scaffolding_type']);
    }

    // --- Helpers ---

    private function createSubmission(SubmissionStatus $status = SubmissionStatus::Pending): Submission
    {
        return Submission::create([
            'user_id' => $this->user->id,
            'question_id' => $this->question->id,
            'skill' => Skill::Writing,
            'answer' => ['text' => 'This is a test essay about environmental protection.'],
            'status' => $status,
        ]);
    }

    private function runGradeJob(Submission $submission, array $agentResult): void
    {
        $job = $this->createJobWithMockedAgent($submission->id, $agentResult);

        $job->handle(
            app(ProgressService::class),
            app(NotificationService::class),
            app(PronunciationService::class),
        );
    }

    private function createJobWithMockedAgent(string $submissionId, array $result): GradeSubmission
    {
        return new class($submissionId, $result) extends GradeSubmission
        {
            public function __construct(
                string $submissionId,
                private readonly array $mockedResult,
            ) {
                parent::__construct($submissionId);
            }

            protected function gradeWriting($submission, $rubric, $knowledgeScope): array
            {
                return $this->mockedResult;
            }

            protected function gradeSpeaking($submission, $rubric, $knowledgeScope, $azureSpeech): array
            {
                return $this->mockedResult;
            }
        };
    }

    private function seedKnowledgePoints(): array
    {
        $grammar = KnowledgePoint::create([
            'category' => KnowledgePointCategory::Grammar,
            'name' => 'Grammar',
            'description' => 'English grammar fundamentals',
        ]);

        $sva = KnowledgePoint::create([
            'category' => KnowledgePointCategory::Grammar,
            'name' => 'Subject-Verb Agreement',
            'description' => 'Subject and verb must agree in number',
        ]);

        DB::table('knowledge_point_edges')->insert([
            'id' => Str::uuid()->toString(),
            'parent_id' => $grammar->id,
            'child_id' => $sva->id,
            'relation' => 'has_subtopic',
        ]);

        return ['grammar' => $grammar, 'sva' => $sva];
    }

    private function seedQuestion(): Question
    {
        $question = Question::create([
            'skill' => Skill::Writing,
            'level' => Level::B2,
            'part' => 2,
            'topic' => 'Environment',
            'content' => ['prompt' => 'Write about environmental protection.'],
            'answer_key' => null,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);

        $question->knowledgePoints()->attach($this->knowledgePoints['sva']->id);

        return $question;
    }

    private function seedRubric(): GradingRubric
    {
        $rubric = GradingRubric::create([
            'skill' => Skill::Writing,
            'level' => Level::B2,
            'is_active' => true,
        ]);

        $this->seedCriteria($rubric, [
            ['key' => 'task_fulfillment', 'name' => 'Task Fulfillment', 'weight' => 0.25, 'sort_order' => 1],
            ['key' => 'organization', 'name' => 'Organization & Coherence', 'weight' => 0.25, 'sort_order' => 2],
            ['key' => 'vocabulary', 'name' => 'Vocabulary Range', 'weight' => 0.25, 'sort_order' => 3],
            ['key' => 'grammar', 'name' => 'Grammar Accuracy', 'weight' => 0.25, 'sort_order' => 4],
        ]);

        return $rubric;
    }

    private function seedCriteria(GradingRubric $rubric, array $criteria): void
    {
        foreach ($criteria as $c) {
            GradingCriterion::create([
                'rubric_id' => $rubric->id,
                ...$c,
                'description' => '',
                'band_descriptors' => [
                    '0-3.5' => 'Yếu',
                    '4-5.5' => 'Trung bình',
                    '6-7.5' => 'Khá',
                    '8-10' => 'Giỏi',
                ],
            ]);
        }
    }
}
