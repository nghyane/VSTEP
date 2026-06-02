<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarPointLevel;
use App\Models\PracticeGrammarAttempt;
use App\Models\Profile;
use App\Models\ProfileGrammarMastery;
use App\Models\ProfileVocabSrsState;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Services\Contracts\LearningPathInterface;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * LearningPathService — read-only aggregation, no external APIs.
 * Tests vocabulary/grammar coverage computation, chart-based skill
 * assessment, and suggestion logic.
 */
final class LearningPathServiceTest extends TestCase
{
    use RefreshDatabase;

    private Profile $profile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->profile = Profile::factory()->create([
            'entry_level' => 'A2',
            'target_level' => 'B1',
            'target_deadline' => now()->addMonths(3)->toDateString(),
        ]);
    }

    // ──── Structure ────

    public function test_for_profile_returns_expected_structure(): void
    {
        $this->mockProgressService(null);

        $result = $this->service()->forProfile($this->profile);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('current_level', $result);
        $this->assertArrayHasKey('target_level', $result);
        $this->assertArrayHasKey('days_remaining', $result);
        $this->assertArrayHasKey('skills', $result);
        $this->assertCount(6, $result['skills']);

        $skills = array_column($result['skills'], 'skill');
        $this->assertContains('vocabulary', $skills);
        $this->assertContains('grammar', $skills);
        $this->assertContains('writing', $skills);
        $this->assertContains('speaking', $skills);
        $this->assertContains('listening', $skills);
        $this->assertContains('reading', $skills);
    }

    public function test_each_skill_has_required_keys(): void
    {
        $this->mockProgressService(null);

        $result = $this->service()->forProfile($this->profile);

        foreach ($result['skills'] as $skill) {
            $this->assertArrayHasKey('skill', $skill);
            $this->assertArrayHasKey('level', $skill);
            $this->assertArrayHasKey('band', $skill);
            $this->assertArrayHasKey('coverage_pct', $skill);
            $this->assertArrayHasKey('total_items', $skill);
            $this->assertArrayHasKey('completed_items', $skill);
            $this->assertArrayHasKey('suggestion', $skill);
        }
    }

    // ──── Vocabulary coverage ────

    public function test_vocabulary_full_coverage_when_all_words_learned(): void
    {
        $topic = VocabTopic::factory()->create(['level' => 'A2', 'is_published' => true]);
        $words = VocabWord::factory()->count(5)->create(['topic_id' => $topic->id]);

        foreach ($words as $word) {
            ProfileVocabSrsState::create([
                'profile_id' => $this->profile->id,
                'word_id' => $word->id,
                'stability' => 3.0,
                'difficulty' => 0.5,
                'state_kind' => 'review',
                'due_at' => now()->addDay(),
            ]);
        }

        $this->mockProgressService(null);

        $vocabSkill = $this->vocabSkillFromResult();

        $this->assertSame(100, $vocabSkill['coverage_pct']);
        $this->assertSame(5, $vocabSkill['total_items']);
        $this->assertSame(5, $vocabSkill['completed_items']);
        $this->assertStringContainsString('Đã hoàn thành', (string) $vocabSkill['suggestion']);
    }

    public function test_vocabulary_partial_coverage(): void
    {
        $topic = VocabTopic::factory()->create(['level' => 'A2', 'is_published' => true]);
        $words = VocabWord::factory()->count(4)->create(['topic_id' => $topic->id]);

        // Only 2 of 4 words learned (stability > 0)
        ProfileVocabSrsState::create([
            'profile_id' => $this->profile->id,
            'word_id' => $words[0]->id,
            'stability' => 3.0,
            'difficulty' => 0.5,
            'state_kind' => 'review',
            'due_at' => now()->addDay(),
        ]);
        ProfileVocabSrsState::create([
            'profile_id' => $this->profile->id,
            'word_id' => $words[1]->id,
            'stability' => 2.0,
            'difficulty' => 0.3,
            'state_kind' => 'review',
            'due_at' => now()->addDay(),
        ]);

        $this->mockProgressService(null);

        $vocabSkill = $this->vocabSkillFromResult();

        $this->assertSame(50, $vocabSkill['coverage_pct']);
        $this->assertSame(4, $vocabSkill['total_items']);
        $this->assertSame(2, $vocabSkill['completed_items']);
        $this->assertStringContainsString('Còn 2 từ vựng', (string) $vocabSkill['suggestion']);
    }

    public function test_vocabulary_coverage_counts_started_srs_words(): void
    {
        $topic = VocabTopic::factory()->create(['level' => 'A2', 'is_published' => true]);
        $word = VocabWord::factory()->create(['topic_id' => $topic->id]);

        ProfileVocabSrsState::create([
            'profile_id' => $this->profile->id,
            'word_id' => $word->id,
            'stability' => 0.0,
            'difficulty' => 0.5,
            'state_kind' => 'learning',
            'due_at' => now()->addMinute(),
        ]);

        $this->mockProgressService(null);

        $vocabSkill = $this->vocabSkillFromResult();

        $this->assertSame(100, $vocabSkill['coverage_pct']);
        $this->assertSame(1, $vocabSkill['completed_items']);
    }

    public function test_vocabulary_zero_coverage(): void
    {
        VocabTopic::factory()->create(['level' => 'A2', 'is_published' => true]);
        VocabWord::factory()->count(3)->create(['topic_id' => VocabTopic::first()->id]);

        $this->mockProgressService(null);

        $vocabSkill = $this->vocabSkillFromResult();

        $this->assertSame(0, $vocabSkill['coverage_pct']);
        $this->assertSame(3, $vocabSkill['total_items']);
        $this->assertSame(0, $vocabSkill['completed_items']);
        $this->assertStringContainsString('Bắt đầu học', (string) $vocabSkill['suggestion']);
    }

    public function test_vocabulary_no_items_at_level(): void
    {
        // No vocab topics at A2 level
        $this->mockProgressService(null);

        $vocabSkill = $this->vocabSkillFromResult();

        $this->assertSame(0, $vocabSkill['coverage_pct']);
        $this->assertSame(0, $vocabSkill['total_items']);
        $this->assertStringContainsString('Chưa có từ vựng', (string) $vocabSkill['suggestion']);
    }

    // ──── Grammar coverage ────

    public function test_grammar_coverage_with_mastered_points(): void
    {
        $point = GrammarPoint::factory()->create(['is_published' => true]);
        GrammarPointLevel::create(['grammar_point_id' => $point->id, 'level' => 'A2']);

        ProfileGrammarMastery::create([
            'profile_id' => $this->profile->id,
            'grammar_point_id' => $point->id,
            'attempts' => 10,
            'correct' => 9,
            'computed_level' => 'mastered',
            'last_practiced_at' => now(),
        ]);

        $this->mockProgressService(null);

        $grammarSkill = $this->grammarSkillFromResult();

        $this->assertSame(100, $grammarSkill['coverage_pct']);
        $this->assertSame(1, $grammarSkill['total_items']);
        $this->assertSame(1, $grammarSkill['completed_items']);
        $this->assertStringContainsString('Đã luyện', (string) $grammarSkill['suggestion']);
    }

    public function test_grammar_coverage_counts_practiced_points(): void
    {
        $point = GrammarPoint::factory()->create(['is_published' => true]);
        GrammarPointLevel::create(['grammar_point_id' => $point->id, 'level' => 'A2']);

        // Learning path shows practice coverage, not strict mastery coverage.
        ProfileGrammarMastery::create([
            'profile_id' => $this->profile->id,
            'grammar_point_id' => $point->id,
            'attempts' => 3,
            'correct' => 2,
            'computed_level' => 'learning',
            'last_practiced_at' => now(),
        ]);

        $this->mockProgressService(null);

        $grammarSkill = $this->grammarSkillFromResult();

        $this->assertSame(100, $grammarSkill['coverage_pct']);
        $this->assertSame(1, $grammarSkill['total_items']);
        $this->assertSame(1, $grammarSkill['completed_items']);
    }

    public function test_grammar_coverage_counts_attempt_rows(): void
    {
        $point = GrammarPoint::factory()->create(['is_published' => true]);
        GrammarPointLevel::create(['grammar_point_id' => $point->id, 'level' => 'A2']);
        $exercise = GrammarExercise::factory()->create(['grammar_point_id' => $point->id]);

        PracticeGrammarAttempt::create([
            'profile_id' => $this->profile->id,
            'grammar_point_id' => $point->id,
            'exercise_id' => $exercise->id,
            'answer' => ['selected_index' => 0],
            'is_correct' => false,
            'attempted_at' => now(),
        ]);

        $this->mockProgressService(null);

        $grammarSkill = $this->grammarSkillFromResult();

        $this->assertSame(100, $grammarSkill['coverage_pct']);
        $this->assertSame(1, $grammarSkill['completed_items']);
    }

    public function test_grammar_filtered_by_level(): void
    {
        // B1 point — should NOT be counted when current level is A2
        $b1Point = GrammarPoint::factory()->create(['is_published' => true]);
        GrammarPointLevel::create(['grammar_point_id' => $b1Point->id, 'level' => 'B1']);

        // A2 point
        $a2Point = GrammarPoint::factory()->create(['is_published' => true]);
        GrammarPointLevel::create(['grammar_point_id' => $a2Point->id, 'level' => 'A2']);

        $this->mockProgressService(null);

        $grammarSkill = $this->grammarSkillFromResult();

        // Only the A2 point is counted
        $this->assertSame(1, $grammarSkill['total_items']);
    }

    // ──── Exam skill suggestions ────

    public function test_exam_skill_with_no_data_suggests_taking_exam(): void
    {
        $this->mockProgressService(null);

        $writingSkill = $this->skillFromResult('writing');

        $this->assertNull($writingSkill['band']);
        $this->assertStringContainsString('Chưa có bài thi', (string) $writingSkill['suggestion']);
    }

    public function test_exam_skill_with_weak_band_suggests_practice(): void
    {
        $chart = [
            'writing' => 3.5,
            'sample_size' => 2,
        ];
        $this->mockProgressService($chart);

        $writingSkill = $this->skillFromResult('writing');

        $this->assertSame(3.5, $writingSkill['band']);
        $this->assertStringContainsString('đang yếu', (string) $writingSkill['suggestion']);
    }

    public function test_exam_skill_with_strong_band_shows_no_urgent_suggestion(): void
    {
        $chart = [
            'speaking' => 7.0,
            'sample_size' => 3,
        ];
        $this->mockProgressService($chart);

        $speakingSkill = $this->skillFromResult('speaking');

        $this->assertSame(7.0, $speakingSkill['band']);
        $this->assertStringContainsString('đã vững', (string) $speakingSkill['suggestion']);
    }

    // ──── Level & deadline ────

    public function test_current_level_uses_entry_level_when_no_chart(): void
    {
        $this->mockProgressService(null);

        $result = $this->service()->forProfile($this->profile);

        $this->assertSame('A2', $result['current_level']);
    }

    public function test_days_remaining_computed_from_deadline(): void
    {
        $this->mockProgressService(null);

        $result = $this->service()->forProfile($this->profile);

        $this->assertNotNull($result['days_remaining']);
        $this->assertGreaterThan(0, $result['days_remaining']);
        $this->assertLessThanOrEqual(92, $result['days_remaining']); // ~3 months
    }

    // ──── Helpers ────

    private function service(): LearningPathInterface
    {
        return $this->app->make(LearningPathInterface::class);
    }

    /** @param  array<string, float|int|null>|null  $chart */
    private function mockProgressService(?array $chart): void
    {
        $progressMock = Mockery::mock(ProgressService::class);

        $progressMock->shouldReceive('chart')
            ->once()
            ->with(Mockery::on(fn (Profile $p) => $p->id === $this->profile->id))
            ->andReturn($chart);

        $level = $chart !== null ? 'A2' : 'A2';
        $progressMock->shouldReceive('predictLevel')
            ->once()
            ->with($chart, 'A2')
            ->andReturn($level);

        $this->app->instance(ProgressService::class, $progressMock);
    }

    /** @return array<string, mixed> */
    private function vocabSkillFromResult(): array
    {
        return $this->skillFromResult('vocabulary');
    }

    /** @return array<string, mixed> */
    private function grammarSkillFromResult(): array
    {
        return $this->skillFromResult('grammar');
    }

    /** @return array<string, mixed> */
    private function skillFromResult(string $skillName): array
    {
        $result = $this->service()->forProfile($this->profile);

        foreach ($result['skills'] as $skill) {
            if ($skill['skill'] === $skillName) {
                return $skill;
            }
        }

        $this->fail("Skill '{$skillName}' not found in result.");
    }
}
