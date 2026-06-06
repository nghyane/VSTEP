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
                'slug' => 'greeting-a-new-colleague',
                'title' => 'Chào hỏi đồng nghiệp mới',
                'level' => 'A1',
                'character_name' => 'Patricia',
                'character_voice_label' => 'us Sierra',
                'description' => 'Patricia là đồng nghiệp mới của bạn. Hôm nay là ngày đầu tiên của cô ấy ở công ty, bạn muốn chào hỏi và làm quen. Patricia thân thiện và vui vẻ trò chuyện.',
                'system_prompt' => 'You are Patricia, a friendly new colleague on your first day at work. You are cheerful, curious, and eager to make friends. Keep responses simple (A1 level). Ask follow-up questions to keep the conversation going.',
                'opening_line' => 'Hi there! I just started working here today. It is nice to meet you! What is your name?',
                'target_vocab' => json_encode(['My name is', 'Nice to meet you too', 'Welcome to the company']),
                'estimated_minutes' => 5,
                'expected_turns' => 6,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'ordering-at-a-cafe',
                'title' => 'Gọi món tại quán cà phê',
                'level' => 'A2',
                'character_name' => 'James',
                'character_voice_label' => 'us Adam',
                'description' => 'James là nhân viên pha chế tại quán cà phê yêu thích của bạn. Bạn muốn gọi đồ uống và món ăn nhẹ. Hãy lịch sự và hỏi về món đặc biệt hôm nay.',
                'system_prompt' => 'You are James, a friendly barista at a cozy café. You know the menu well and love recommending drinks. Keep responses at A2 level. Mention specials when asked.',
                'opening_line' => 'Hi! Welcome to Brew House. What can I get for you today?',
                'target_vocab' => json_encode(['I would like', 'How much', 'Do you have']),
                'estimated_minutes' => 4,
                'expected_turns' => 5,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'first-job-interview',
                'title' => 'Buổi phỏng vấn đầu tiên',
                'level' => 'B1',
                'character_name' => 'Linda',
                'character_voice_label' => 'us Sierra',
                'description' => 'Linda đang phỏng vấn bạn cho vị trí thực tập. Hãy giới thiệu bản thân, nói về điểm mạnh và hỏi một câu về vai trò này.',
                'system_prompt' => 'You are Linda, a professional but warm HR interviewer. Ask about the candidate\'s background, strengths, and motivation. Keep language at B1 level. Give brief encouraging feedback.',
                'opening_line' => 'Thanks for coming in today. Could you start by telling me a little about yourself?',
                'target_vocab' => json_encode(["I'm currently", 'I have experience in', "I'm passionate about"]),
                'estimated_minutes' => 8,
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
            ->whereIn('slug', ['greeting-a-new-colleague', 'ordering-at-a-cafe', 'first-job-interview'])
            ->delete();
    }
};
