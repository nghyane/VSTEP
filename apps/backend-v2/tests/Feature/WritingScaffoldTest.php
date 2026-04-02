<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Ai\Agents\WritingTemplateGenerator;
use App\Enums\Level;
use App\Enums\PracticeMode;
use App\Enums\Skill;
use App\Models\Question;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WritingScaffoldTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_generates_template_scaffold_for_tier_1(): void
    {
        WritingTemplateGenerator::fake([
            [
                'sections' => [
                    [
                        'title' => 'Lời mở đầu',
                        'parts' => [
                            [
                                'type' => 'text',
                                'content' => 'Dear Sir/Madam,',
                                'id' => null,
                                'label' => null,
                                'variant' => null,
                                'hints' => null,
                            ],
                            [
                                'type' => 'blank',
                                'content' => null,
                                'id' => 'opening_reason',
                                'label' => 'lý do viết thư',
                                'variant' => 'content',
                                'hints' => [
                                    'b1' => ['I am writing to ask about'],
                                    'b2' => ['I am writing to enquire about'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $user = $this->makeLearner();
        $question = $this->makeWritingQuestion(Level::A2, 1);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/practice/generate-writing-scaffold', [
                'question_id' => $question->id,
                'tier' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.question_id', $question->id)
            ->assertJsonPath('data.tier', 1)
            ->assertJsonPath('data.requested_tier', 1)
            ->assertJsonPath('data.effective_tier', 1)
            ->assertJsonPath('data.type', 'template')
            ->assertJsonPath('data.fallback_reason', null)
            ->assertJsonPath('data.payload.sections.0.title', 'Lời mở đầu')
            ->assertJsonPath('data.payload.sections.0.parts.0.type', 'text')
            ->assertJsonPath('data.payload.sections.0.parts.1.type', 'blank');
    }

    #[Test]
    public function it_generates_guided_scaffold_for_tier_2_without_ai(): void
    {
        WritingTemplateGenerator::fake()->preventStrayPrompts();

        $user = $this->makeLearner();
        $question = $this->makeWritingQuestion(Level::B1, 2);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/practice/generate-writing-scaffold', [
                'question_id' => $question->id,
                'tier' => 2,
            ])
            ->assertOk()
            ->assertJsonPath('data.question_id', $question->id)
            ->assertJsonPath('data.tier', 2)
            ->assertJsonPath('data.requested_tier', 2)
            ->assertJsonPath('data.effective_tier', 2)
            ->assertJsonPath('data.type', 'guided')
            ->assertJsonPath('data.fallback_reason', null)
            ->assertJsonPath('data.payload.word_count', '150-180 words');

        WritingTemplateGenerator::assertNeverPrompted();
    }

    #[Test]
    public function it_falls_back_to_guided_scaffold_when_tier_1_ai_output_is_invalid(): void
    {
        WritingTemplateGenerator::fake([
            [
                'sections' => [],
            ],
        ]);

        $user = $this->makeLearner();
        $question = $this->makeWritingQuestion(Level::A2, 1);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/practice/generate-writing-scaffold', [
                'question_id' => $question->id,
                'tier' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.question_id', $question->id)
            ->assertJsonPath('data.tier', 1)
            ->assertJsonPath('data.requested_tier', 1)
            ->assertJsonPath('data.effective_tier', 2)
            ->assertJsonPath('data.type', 'guided')
            ->assertJsonPath('data.fallback_reason', 'template_unavailable')
            ->assertJsonPath('data.payload.word_count', '80-100 words');
    }

    #[Test]
    public function it_generates_freeform_scaffold_for_tier_3(): void
    {
        WritingTemplateGenerator::fake()->preventStrayPrompts();

        $user = $this->makeLearner();
        $question = $this->makeWritingQuestion(Level::B2, 2);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/practice/generate-writing-scaffold', [
                'question_id' => $question->id,
                'tier' => 3,
            ])
            ->assertOk()
            ->assertJsonPath('data.question_id', $question->id)
            ->assertJsonPath('data.tier', 3)
            ->assertJsonPath('data.requested_tier', 3)
            ->assertJsonPath('data.effective_tier', 3)
            ->assertJsonPath('data.type', 'freeform')
            ->assertJsonPath('data.fallback_reason', null)
            ->assertJsonPath('data.payload', null);

        WritingTemplateGenerator::assertNeverPrompted();
    }

    #[Test]
    public function it_includes_unified_writing_scaffold_in_practice_item(): void
    {
        WritingTemplateGenerator::fake()->preventStrayPrompts();

        $user = $this->makeLearner();
        UserProgress::updateOrCreate(
            ['user_id' => $user->id, 'skill' => Skill::Writing],
            [
                'current_level' => Level::B1,
                'target_level' => Level::B2,
                'scaffold_level' => 1,
                'streak_count' => 0,
                'streak_direction' => 'neutral',
                'attempt_count' => 0,
            ],
        );

        $question = $this->makeWritingQuestion(Level::B1, 2);

        $this->actingAs($user, 'api')
            ->postJson('/api/v1/practice/sessions', [
                'skill' => Skill::Writing->value,
                'mode' => PracticeMode::Guided->value,
                'level' => Level::B1->value,
                'items_count' => 1,
                'part' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('data.current_item.question.id', $question->id)
            ->assertJsonPath('data.current_item.writing_scaffold.tier', 2)
            ->assertJsonPath('data.current_item.writing_scaffold.requested_tier', 2)
            ->assertJsonPath('data.current_item.writing_scaffold.effective_tier', 2)
            ->assertJsonPath('data.current_item.writing_scaffold.type', 'guided')
            ->assertJsonPath('data.current_item.writing_scaffold.fallback_reason', null)
            ->assertJsonPath('data.current_item.writing_scaffold.payload.word_count', '150-180 words');

        WritingTemplateGenerator::assertNeverPrompted();
    }

    private function makeWritingQuestion(Level $level, int $part): Question
    {
        return Question::create([
            'skill' => Skill::Writing,
            'level' => $level,
            'part' => $part,
            'topic' => 'Writing topic',
            'content' => [
                'prompt' => 'Write about a familiar topic.',
                'taskType' => $part === 1 ? 'letter' : 'essay',
                'requiredPoints' => ['point one', 'point two'],
                'minWords' => 120,
            ],
            'is_active' => true,
        ]);
    }

    private function makeLearner(): User
    {
        return User::create([
            'full_name' => 'Writer',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'role' => 'learner',
        ]);
    }
}
