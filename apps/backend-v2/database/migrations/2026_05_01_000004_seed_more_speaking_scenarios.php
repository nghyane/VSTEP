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
                'slug' => 'asking-for-directions',
                'title' => 'Asking for directions',
                'level' => 'A1',
                'character_name' => 'Tom',
                'character_voice_label' => 'us Adam',
                'description' => 'You are lost in a new city. Tom is a friendly local who can help you find the train station. Ask politely and thank him.',
                'system_prompt' => 'You are Tom, a helpful local. Give simple directions using left, right, straight, and landmarks. Keep language at A1 level. Be patient and friendly.',
                'opening_line' => 'Hey! You look a bit lost. Can I help you find something?',
                'target_vocab' => json_encode(['Where is', 'Turn left', 'Thank you']),
                'estimated_minutes' => 4,
                'expected_turns' => 5,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'shopping-for-clothes',
                'title' => 'Shopping for clothes',
                'level' => 'A2',
                'character_name' => 'Emma',
                'character_voice_label' => 'us Sierra',
                'description' => 'Emma works at a clothing store. You want to buy a shirt and need help with sizes and colors. Ask about prices and try something on.',
                'system_prompt' => 'You are Emma, a helpful shop assistant at a clothing store. Help customers find the right size, color, and style. Keep language at A2 level. Be enthusiastic about fashion.',
                'opening_line' => 'Welcome to Fashion Hub! Are you looking for something special today?',
                'target_vocab' => json_encode(['Can I try', 'What size', 'How much is']),
                'estimated_minutes' => 5,
                'expected_turns' => 6,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'checking-into-hotel',
                'title' => 'Checking into a hotel',
                'level' => 'A2',
                'character_name' => 'David',
                'character_voice_label' => 'us Adam',
                'description' => 'David is the hotel receptionist. You need to check in, ask about breakfast times, and request an extra pillow.',
                'system_prompt' => 'You are David, a professional hotel receptionist. Help guests check in, answer questions about facilities, and handle requests. Keep language at A2 level. Be polite and efficient.',
                'opening_line' => 'Good evening! Welcome to Grand Hotel. Do you have a reservation?',
                'target_vocab' => json_encode(['I have a reservation', 'What time is', 'Could I have']),
                'estimated_minutes' => 5,
                'expected_turns' => 6,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'visiting-the-doctor',
                'title' => 'Visiting the doctor',
                'level' => 'B1',
                'character_name' => 'Dr. Sarah',
                'character_voice_label' => 'us Sierra',
                'description' => 'You have a headache and sore throat. Dr. Sarah will ask about your symptoms. Describe how you feel and ask about treatment.',
                'system_prompt' => 'You are Dr. Sarah, a caring family doctor. Ask about symptoms, duration, and lifestyle. Give simple medical advice. Keep language at B1 level. Be reassuring.',
                'opening_line' => 'Hello! Please have a seat. What seems to be the problem today?',
                'target_vocab' => json_encode(['I have been feeling', 'It started', 'Should I take']),
                'estimated_minutes' => 6,
                'expected_turns' => 7,
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => Str::uuid()->toString(),
                'slug' => 'making-travel-plans',
                'title' => 'Making travel plans',
                'level' => 'B2',
                'character_name' => 'Mike',
                'character_voice_label' => 'us Adam',
                'description' => 'Mike is your friend. You are planning a weekend trip together. Discuss destinations, activities, budget, and accommodation.',
                'system_prompt' => 'You are Mike, an adventurous friend who loves traveling. Suggest destinations, discuss pros and cons, and negotiate plans. Use natural B2-level English with idioms.',
                'opening_line' => "Hey! So I was thinking we should plan that weekend trip we've been talking about. Any ideas where to go?",
                'target_vocab' => json_encode(['How about', 'I would prefer', 'What do you think']),
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
            ->whereIn('slug', [
                'asking-for-directions',
                'shopping-for-clothes',
                'checking-into-hotel',
                'visiting-the-doctor',
                'making-travel-plans',
            ])
            ->delete();
    }
};
