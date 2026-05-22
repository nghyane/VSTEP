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
                'title' => 'Greeting a new colleague',
                'level' => 'A1',
                'character_name' => 'Patricia',
                'character_voice_label' => 'us Sierra',
                'description' => 'Patricia is your new colleague. Today is her first day at the company, and you want to say hello and get to know her. Patricia is friendly and happy to chat.',
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
                'title' => 'Ordering at a café',
                'level' => 'A2',
                'character_name' => 'James',
                'character_voice_label' => 'us Adam',
                'description' => 'James is the barista at your favourite café. You want to order a drink and a snack. Be polite and ask about today\'s specials.',
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
                'title' => 'First job interview',
                'level' => 'B1',
                'character_name' => 'Linda',
                'character_voice_label' => 'us Sierra',
                'description' => 'Linda is interviewing you for an internship. Introduce yourself, talk about your strengths, and ask one question about the role.',
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
