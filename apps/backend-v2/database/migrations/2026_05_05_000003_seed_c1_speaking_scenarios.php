<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('practice_speaking_scenarios')->insert([
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'analyzing-news-article',
                'title' => 'Phân tích một bài báo',
                'level' => 'C1',
                'character_name' => 'Professor Martin',
                'character_voice_label' => 'us Adam',
                'description' => 'Giáo sư Martin thảo luận về một bài báo gần đây nói rằng trí tuệ nhân tạo thay thế việc làm. Hãy phân tích lập luận, đánh giá bằng chứng và trình bày góc nhìn của bạn.',
                'system_prompt' => 'You are Professor Martin, a critical thinking lecturer. Discuss news articles analytically, challenge assumptions, ask for evidence, and explore multiple perspectives. Use sophisticated C1-level English with academic register.',
                'opening_line' => 'I came across a fascinating article arguing that AI will replace fifty percent of jobs within the next decade. What is your initial reaction to that claim?',
                'target_vocab' => json_encode(['That is a compelling argument however', 'The evidence suggests that', 'From a broader perspective']),
                'estimated_minutes' => 10,
                'expected_turns' => 8,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'presenting-research-findings',
                'title' => 'Trình bày kết quả nghiên cứu',
                'level' => 'C1',
                'character_name' => 'Dr. Nguyen',
                'character_voice_label' => 'us Sierra',
                'description' => 'Tiến sĩ Nguyễn là người hướng dẫn luận văn của bạn. Hãy trình bày kết quả nghiên cứu về xu hướng đô thị hóa, bảo vệ phương pháp và thảo luận hàm ý.',
                'system_prompt' => 'You are Dr. Nguyen, a demanding but fair thesis supervisor. Ask probing questions about methodology, challenge interpretations, and push for deeper analysis. Use academic C1-level English.',
                'opening_line' => 'Good morning. I have reviewed your draft chapter on urbanization trends. Could you walk me through your key findings and how you arrived at them?',
                'target_vocab' => json_encode(['The data indicates that', 'One limitation of this approach', 'This has significant implications for']),
                'estimated_minutes' => 10,
                'expected_turns' => 8,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'negotiating-a-solution',
                'title' => 'Đàm phán giải pháp cộng đồng',
                'level' => 'C1',
                'character_name' => 'Councilor Park',
                'character_voice_label' => 'us Adam',
                'description' => 'Ủy viên Park đang thảo luận đề xuất xây nhà máy gần khu dân cư. Hãy đàm phán giải pháp cân bằng giữa phát triển kinh tế và chất lượng sống của cư dân.',
                'system_prompt' => 'You are Councilor Park, a pragmatic local politician. Present economic arguments for the factory, listen to counterpoints, and work toward compromise. Use nuanced C1-level English with diplomatic language.',
                'opening_line' => 'Thank you for attending this town hall meeting. As you know, the proposed factory would bring three hundred jobs to our community, but I understand there are concerns. What are your thoughts?',
                'target_vocab' => json_encode(['While I acknowledge the benefits', 'A possible compromise would be', 'We need to weigh the pros and cons']),
                'estimated_minutes' => 10,
                'expected_turns' => 8,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        DB::table('practice_speaking_scenarios')
            ->whereIn('slug', [
                'analyzing-news-article',
                'presenting-research-findings',
                'negotiating-a-solution',
            ])
            ->delete();
    }
};
