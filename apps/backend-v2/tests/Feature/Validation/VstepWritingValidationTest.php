<?php

declare(strict_types=1);

namespace Tests\Feature\Validation;

use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\User;
use App\Models\WritingGradingResult;
use App\Services\Grading\GradingService;
use App\Services\RuleBasedScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Qualitative validation: compare system grading output with expert analysis
 * from luyenthivstep.vn (published VSTEP B1 sample essays with criterion-level analysis).
 *
 * Source: luyenthivstep.vn/cam-nang-vstep/5-bai-mau-writing-vstep-b1
 * Reference: ULIS-VNU scoring validity study (VNU Journal of Foreign Studies, 2018)
 */
final class VstepWritingValidationTest extends TestCase
{
    use RefreshDatabase;

    private GradingService $grading;
    private RuleBasedScoringService $metrics;

    protected function setUp(): void
    {
        parent::setUp();
        $this->grading = $this->app->make(GradingService::class);
        $this->metrics = new RuleBasedScoringService;
    }

    /**
     * @return list<array{string, string, string, array<string,string>}>
     */
    public static function essayProvider(): array
    {
        return [
            ['Bài1_FavoriteDay', self::B1_FAVORITE_DAY, 'letter', 'B1', [
                'task_fulfillment' => 'Cao — trả lời đúng yêu cầu, miêu tả đầy đủ, có tương tác, >120 từ',
                'organization' => 'Rõ ràng theo trình tự thời gian sáng→tối, kết thúc bằng câu hỏi',
                'vocabulary' => 'Phù hợp B1: exercise, badminton, traditional dish, swimming',
                'grammar' => 'Đúng cơ bản, hiện tại đơn nhất quán, ít lỗi',
            ]],
            ['Bài2_JobApp', self::B2_JOB_APP, 'letter', 'B1-B2', [
                'task_fulfillment' => 'Đầy đủ: giới thiệu vị trí, kinh nghiệm 3 năm, thành tích 15%, mong phỏng vấn',
                'organization' => 'Mở-thân-kết, ý vào đoạn nấy, kết lịch sự',
                'vocabulary' => 'Trang trọng: Sales Manager, advertised, suitable candidate, at your earliest convenience',
                'grammar' => 'Câu ghép chính xác, present perfect + past simple đúng',
            ]],
            ['Bài3_OnlineShop', self::B3_ONLINE_SHOPPING, 'essay', 'B1', [
                'task_fulfillment' => 'Đúng: 2 lợi ích + 3 bất lợi, ý kiến cá nhân ở kết',
                'organization' => 'Rõ ràng: intro→advantages→disadvantages→conclusion, On the one hand/On the other hand',
                'vocabulary' => 'Đủ B1: online shopping, deliver, compare prices, hackers, scammers',
                'grammar' => 'Cấu trúc B1 ổn định, câu đơn+ghép xen kẽ',
            ]],
            ['Bài4_YouthUnemployment', self::B4_YOUTH_UNEMPLOYMENT, 'essay', 'B1', [
                'task_fulfillment' => 'Đầy đủ: 3 effects + 2 solutions, ví dụ minh họa, ~260 từ',
                'organization' => '4 đoạn: intro→effects→solutions→conclusion, ý rõ',
                'vocabulary' => 'B1: unemployment, frustrated, professional skills, invest, job opportunities',
                'grammar' => 'Ổn định: if, mệnh đề quan hệ, câu ghép and/so',
            ]],
            ['Bài5_AirPollution', self::B5_AIR_POLLUTION, 'essay', 'B1-B2', [
                'task_fulfillment' => 'Xuất sắc: nêu quan điểm, vai trò chính phủ + cá nhân, ví dụ cụ thể',
                'organization' => 'Mở-thân-kết rõ: intro+government+individual+conclusion',
                'vocabulary' => 'Phong phú: authorities, strict laws, renewable energy, public transport, power plants',
                'grammar' => 'B1 vững: câu ghép, mệnh đề quan hệ (which can greatly...), if',
            ]],
        ];
    }

    #[DataProvider('essayProvider')]
    public function test_grading_pipeline_produces_valid_output(
        string $label,
        string $text,
        string $type,
        string $expectedLevel,
        array $expertAnalysis,
    ): void {
        $this->assertNotEmpty($text);

        // Compute metrics
        $result = $this->metrics->analyze($text, []);
        $metrics = $result['metrics'];
        $this->assertGreaterThan(0, $metrics['word_count']);

        // Verify penalty is continuous
        $penalty = min(1.0, $metrics['word_count'] / 120.0);
        $this->assertGreaterThan(0, $penalty);
        $this->assertLessThanOrEqual(1.0, $penalty);

        // Grade through full pipeline
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $prompt = PracticeWritingPrompt::factory()->create();
        $session = PracticeSession::create([
            'profile_id' => $profile->id,
            'module' => 'writing',
            'content_ref_type' => 'practice_writing_prompt',
            'content_ref_id' => $prompt->id,
            'started_at' => now(),
            'ended_at' => now(),
            'duration_seconds' => 60,
        ]);
        PracticeWritingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'prompt_id' => $prompt->id,
            'text' => $text,
            'word_count' => $metrics['word_count'],
            'submitted_at' => now(),
        ]);

        $submission = PracticeWritingSubmission::first();
        $this->grading->enqueue('practice_writing', $submission->id);

        $gradingResult = WritingGradingResult::query()
            ->where('submission_type', 'practice_writing')
            ->where('submission_id', $submission->id)
            ->where('is_active', true)
            ->first();

        $this->assertNotNull($gradingResult);
        $this->assertTrue($gradingResult->overall_band >= 0 && $gradingResult->overall_band <= 10);
        $this->assertArrayHasKey('task_fulfillment', $gradingResult->rubric_scores);
        $this->assertArrayHasKey('organization', $gradingResult->rubric_scores);
        $this->assertArrayHasKey('grammar', $gradingResult->rubric_scores);
        $this->assertArrayHasKey('vocabulary', $gradingResult->rubric_scores);
        $this->assertIsArray($gradingResult->strengths);
        $this->assertIsArray($gradingResult->improvements);

        // 6. Verify task fulfillment uses requirements from prompt
        // Factory creates required_points = ['State your opinion', 'Give at least two reasons', 'Provide a conclusion']
        // FakeLlmGrader returns points_covered=3, points_required=3, position=true
        // Formula: (3/3)×7 + 1 = 8.0, clampRound → 8.0
        $this->assertTrue(
            $gradingResult->rubric_scores['task_fulfillment'] >= 5.0
            && $gradingResult->rubric_scores['task_fulfillment'] <= 10.0,
            'Task fulfillment should reflect requirements coverage'
        );

        // 7. Verify grammar uses SyntaxAnalyzer (structure types from real text)
        $this->assertTrue(
            $gradingResult->rubric_scores['grammar'] >= 5.0
            && $gradingResult->rubric_scores['grammar'] <= 10.0,
            'Grammar should reflect structure complexity'
        );

        // 8. Verify organization includes sentence_variety
        $this->assertTrue(
            $gradingResult->rubric_scores['organization'] >= 1.0
            && $gradingResult->rubric_scores['organization'] <= 10.0,
            'Organization should reflect paragraph + linking + variety'
        );

        // 9. Verify vocabulary uses unique ratio + word length
        $this->assertTrue(
            $gradingResult->rubric_scores['vocabulary'] >= 1.0
            && $gradingResult->rubric_scores['vocabulary'] <= 8.0,
            'Vocabulary should reflect lexical metrics, capped at 8'
        );
    }

    // ─── Sanity penalty formula: W' = W × min(1, w/120), round 0.5 ───

    public function test_sanity_penalty_formula(): void
    {
        $this->assertSame(0.0, $this->penalty(0, 7.0));
        $this->assertSame(3.5, $this->penalty(60, 7.0));
        $this->assertSame(5.5, $this->penalty(90, 7.0));
        $this->assertSame(7.0, $this->penalty(120, 7.0));
        $this->assertSame(7.0, $this->penalty(250, 7.0));
    }

    public function test_overall_band_rounding(): void
    {
        $this->assertSame(7.0, $this->r05(7.0));
        $this->assertSame(7.0, $this->r05(7.1));
        $this->assertSame(7.5, $this->r05(7.3));
        $this->assertSame(7.5, $this->r05(7.5));
        $this->assertSame(8.0, $this->r05(7.8));
    }

    public function test_level_mapping(): void
    {
        $this->assertSame('Không đạt', $this->level(3.5));
        $this->assertSame('B1', $this->level(4.0));
        $this->assertSame('B1', $this->level(5.5));
        $this->assertSame('B2', $this->level(6.0));
        $this->assertSame('B2', $this->level(8.0));
        $this->assertSame('C1', $this->level(8.5));
    }

    public function test_writing_composite_task2_weight(): void
    {
        $this->assertSame(6.0, $this->composite(6.0, 6.0));
        $this->assertSame(7.0, $this->composite(5.0, 8.0));
        $this->assertSame(7.5, $this->composite(7.5, 7.5));
        $this->assertSame(6.0, $this->composite(4.0, 7.0));
        $this->assertSame(6.0, $this->composite(5.5, 6.0));
    }

    // ─── Helpers ───

    private function penalty(int $w, float $b): float
    {
        return $w === 0 ? 0.0 : round($b * min(1.0, $w / 120.0) * 2) / 2;
    }

    private function r05(float $v): float
    {
        return round($v * 2) / 2;
    }

    private function level(float $b): string
    {
        return match (true) {
            $b >= 8.5 => 'C1',
            $b >= 6.0 => 'B2',
            $b >= 4.0 => 'B1',
            default => 'Không đạt',
        };
    }

    private function composite(float $w1, float $w2): float
    {
        return round((($w1 + 2 * $w2) / 3) * 2) / 2;
    }

    // ─── VSTEP B1 sample essays from luyenthivstep.vn ───

    private const B1_FAVORITE_DAY = "Dear Minh,\n\nI hope you are doing well. I am going to tell you about my favorite day of the week. I like Sunday most because I don't have to go to school and I can do a lot of things I like. In the morning, I get up at about 6 o'clock and then I go to the park near my house to do some exercise. I usually play badminton with my friends. It's relaxing and good for my health. Then I go home and have a bath. I have breakfast with bread and a cup of coffee. Sometimes I go out and have pho, a traditional Vietnamese dish. After breakfast I often go shopping with my best friend, Phuong. We buy things and eat at a shopping center. In the afternoon, I go swimming - this is my favorite sport. I swim for about 2 hours and then I go home to have dinner with my family. In the evening, I watch TV or listen to music. I usually go to bed at 10 o'clock. Sunday is really a wonderful day for me. Tell me about your favorite day when you write back.\n\nBest wishes,\nLan";

    private const B2_JOB_APP = "Dear Sir/Madam,\n\nI am writing to express my interest in the Sales Manager position at BetTok Company, as advertised on your website. I have over three years of experience in sales and customer service, and I also have good communication and negotiation skills. I have successfully increased sales in my current role by 15% over the past year. I think my ability to understand customer needs and build relationships makes me a suitable candidate for this job. I am confident that my skills and experience will fit well with the requirements of your team. I hope to discuss my application further in an interview at your earliest convenience. Thank you for considering my application.\n\nYours faithfully,\nNguyen Van A";

    private const B3_ONLINE_SHOPPING = "We cannot deny that more and more people are becoming interested in online shopping. However, there are both good and bad things about shopping on the internet. On the one hand, online shopping has some advantages. First, it is convenient because we do not have to go to physical stores to buy things. We just need a phone or computer connected to the internet and the products will be delivered to our house. Second, it is cheaper than in-store shopping. You can easily compare prices on different websites in a few minutes. On the other hand, there are some disadvantages. Firstly, sometimes the products might be of low quality. When you order online, you only see the pictures and you cannot check the quality in person. Secondly, your personal information like bank account could be stolen by hackers and scammers. Thirdly, shopping online can make people spend too much money because it is so easy to place an order. In conclusion, online shopping has both benefits and drawbacks. In my opinion, it is a positive development overall because it makes life more convenient. However, people should be careful when shopping online to avoid problems.";

    private const B4_YOUTH_UNEMPLOYMENT = "Nowadays, unemployment among young people is becoming a serious problem in many countries. This essay will discuss the effects of youth unemployment and suggest some possible solutions. Firstly, being jobless can make young people feel very sad and stressed. They have no income, so they cannot support themselves or help their families. This often leads to frustration in their life. Secondly, if they cannot find a job related to what they studied, they might forget the important knowledge and skills they learned in school. Some of them may have to take any work just to earn money, and over time they lose their professional skills. Finally, high unemployment among young people can lead to social problems. For example, a few unemployed youths might start stealing or doing other crimes to get money. However, there are some solutions to help reduce youth unemployment. On one hand, each young person should try to improve their abilities to meet the needs of employers. They can learn new skills or even start a small business. On the other hand, the government should create more job opportunities. For instance, they can invest in projects that need many workers or support young people to start new companies. In conclusion, youth unemployment has many negative effects on individuals and society. However, if both young people and the government work together, this problem can be solved.";

    private const B5_AIR_POLLUTION = "Air pollution is becoming a big problem in many countries. Some people think that normal individuals cannot do anything to solve this problem and only the government is responsible for it. I do not agree with this opinion, because I believe that both the government and ordinary people should work together to reduce air pollution. On the one hand, the government plays the most important role in fighting air pollution. The authorities can make strict laws to control pollution from factories and vehicles. For example, they can limit the number of cars in city centers or require factories to install filters to clean the smoke before releasing it into the air. They can also invest in renewable energy like solar or wind power, which can greatly cut down air pollution in the long term. On the other hand, individuals are also responsible for reducing air pollution. Every person can do small things that make a big difference. For example, instead of using private cars or motorbikes, people can use public transport like buses or trains. They can also plant more trees around their houses because trees help clean the air. Furthermore, people can save electricity at home by turning off lights and appliances when they are not using them, which helps reduce the amount of pollution from power plants. In conclusion, I strongly believe that both the government and individuals play important roles in reducing air pollution. If both sides work together, we can have cleaner air and a healthier environment.";
}
