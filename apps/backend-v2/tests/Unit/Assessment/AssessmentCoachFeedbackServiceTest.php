<?php

declare(strict_types=1);

namespace Tests\Unit\Assessment;

use App\Ai\Contracts\SpeakingFeedbackGenerator;
use App\Ai\Contracts\WritingFeedbackGenerator;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\CriterionScore;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Assessment\Enums\CriterionKey;
use App\Services\AssessmentCoachFeedbackService;
use PHPUnit\Framework\TestCase;

final class AssessmentCoachFeedbackServiceTest extends TestCase
{
    public function test_exam_writing_gets_automatic_coach_feedback(): void
    {
        $service = new AssessmentCoachFeedbackService(new CoachTestWritingFeedbackGenerator, new CoachTestSpeakingFeedbackGenerator);
        $feedback = new FeedbackBag(evidenceNotes: [
            'grammar' => ['label' => 'Ngữ pháp', 'detail' => '0 lỗi ngữ pháp.'],
        ]);

        $result = $service->forExam(
            new AssessmentInput(
                profileId: 'profile-1',
                skill: AssessmentSkill::Writing,
                taskType: AssessmentTaskType::WritingTask1Letter,
                sourceType: AssessmentSourceType::Exam,
                sourceId: 'submission-1',
                prompt: ['prompt' => 'Write a letter.', 'part' => 1],
                text: 'Dear friend, this is my answer.',
            ),
            new SignalBag(
                grammar: ['errors' => []],
                vocabulary: ['word_count' => 6],
            ),
            new ScoreBag([], 6.0),
            $feedback,
        );

        $this->assertSame(['Điểm mạnh tự động'], $result->strengths);
        $this->assertSame(['Cần cải thiện tự động'], $result->improvements);
        $this->assertSame(['Original: bad → Improved: better'], $result->rewrites);
        $this->assertSame($feedback->evidenceNotes, $result->evidenceNotes);
    }

    public function test_practice_feedback_is_not_generated_automatically(): void
    {
        $service = new AssessmentCoachFeedbackService(new CoachTestWritingFeedbackGenerator, new CoachTestSpeakingFeedbackGenerator);
        $feedback = new FeedbackBag(evidenceNotes: ['grammar' => ['label' => 'Ngữ pháp', 'detail' => '0 lỗi.']]);

        $result = $service->forExam(
            new AssessmentInput(
                profileId: 'profile-1',
                skill: AssessmentSkill::Writing,
                taskType: AssessmentTaskType::WritingTask2Essay,
                sourceType: AssessmentSourceType::Practice,
                sourceId: 'submission-1',
                prompt: ['prompt' => 'Write an essay.'],
                text: 'Practice answer.',
            ),
            new SignalBag,
            new ScoreBag([], 6.0),
            $feedback,
        );

        $this->assertSame([], $result->strengths);
        $this->assertSame([], $result->improvements);
        $this->assertSame([], $result->rewrites);
        $this->assertSame($feedback->evidenceNotes, $result->evidenceNotes);
    }

    public function test_exam_speaking_gets_automatic_coach_feedback(): void
    {
        $service = new AssessmentCoachFeedbackService(new CoachTestWritingFeedbackGenerator, new CoachTestSpeakingFeedbackGenerator);

        $result = $service->forExam(
            new AssessmentInput(
                profileId: 'profile-1',
                skill: AssessmentSkill::Speaking,
                taskType: AssessmentTaskType::SpeakingPart1Personal,
                sourceType: AssessmentSourceType::Exam,
                sourceId: 'submission-1',
                prompt: ['content' => ['Talk about your hometown.']],
            ),
            new SignalBag(
                vocabulary: ['word_count' => 30],
                speech: ['transcript' => 'This is my speaking answer.', 'speaking_rate' => 120],
                coherence: ['linking_word_count' => 1],
                pronunciation: ['overall' => 7.0],
            ),
            new ScoreBag([
                new CriterionScore(CriterionKey::Fluency, 6.0, 1.0),
            ], 6.0),
            new FeedbackBag,
        );

        $this->assertSame(['Nói rõ ý'], $result->strengths);
        $this->assertSame(['Cần giảm ngắt nghỉ'], $result->improvements);
        $this->assertSame([], $result->rewrites);
    }
}

final class CoachTestWritingFeedbackGenerator implements WritingFeedbackGenerator
{
    public function generate(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null, int $part = 2): array
    {
        return [
            'strengths' => ['Điểm mạnh tự động'],
            'improvements' => ['Cần cải thiện tự động'],
            'rewrites' => ['Original: bad → Improved: better'],
        ];
    }
}

final class CoachTestSpeakingFeedbackGenerator implements SpeakingFeedbackGenerator
{
    public function generate(string $transcript, string $promptText, array $scores, array $metrics, ?array $bandContext = null): array
    {
        return [
            'strengths' => ['Nói rõ ý'],
            'improvements' => ['Cần giảm ngắt nghỉ'],
        ];
    }
}
