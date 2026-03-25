<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ExamType;
use App\Enums\Level;
use App\Enums\Skill;
use App\Models\Exam;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExamSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@vstep.local')->first();

        $listeningIds = Question::where('skill', Skill::Listening)->pluck('id', 'level');
        $readingIds = Question::where('skill', Skill::Reading)->pluck('id', 'level');

        // Group question IDs by skill for blueprint
        $listeningByLevel = Question::where('skill', Skill::Listening)
            ->get()
            ->groupBy(fn ($q) => $q->level->value)
            ->map(fn ($qs) => $qs->pluck('id')->all());

        $readingByLevel = Question::where('skill', Skill::Reading)
            ->get()
            ->groupBy(fn ($q) => $q->level->value)
            ->map(fn ($qs) => $qs->pluck('id')->all());

        // Practice exams per level
        foreach (Level::cases() as $level) {
            $blueprint = [];
            $lIds = $listeningByLevel->get($level->value, []);
            $rIds = $readingByLevel->get($level->value, []);

            if ($lIds) {
                $blueprint['listening'] = ['skill' => 'listening', 'question_ids' => $lIds];
            }
            if ($rIds) {
                $blueprint['reading'] = ['skill' => 'reading', 'question_ids' => $rIds];
            }

            if (empty($blueprint)) {
                continue;
            }

            Exam::create([
                'title' => "VSTEP Practice {$level->value}",
                'level' => $level,
                'type' => ExamType::Practice,
                'duration_minutes' => 60,
                'blueprint' => array_values($blueprint),
                'description' => "Đề luyện tập VSTEP trình độ {$level->value} — Listening & Reading",
                'is_active' => true,
                'created_by' => $admin?->id,
            ]);
        }

        // Placement exam — mix A2+B1+B2 questions
        $placementBlueprint = [];
        $allListening = $listeningByLevel->flatten()->all();
        $allReading = $readingByLevel->flatten()->all();

        if ($allListening) {
            $placementBlueprint[] = ['skill' => 'listening', 'question_ids' => $allListening];
        }
        if ($allReading) {
            $placementBlueprint[] = ['skill' => 'reading', 'question_ids' => $allReading];
        }

        if ($placementBlueprint) {
            Exam::create([
                'title' => 'VSTEP Placement Test',
                'level' => Level::B1,
                'type' => ExamType::Placement,
                'duration_minutes' => 45,
                'blueprint' => $placementBlueprint,
                'description' => 'Bài test xếp lớp — đánh giá trình độ Listening & Reading',
                'is_active' => true,
                'created_by' => $admin?->id,
            ]);
        }
    }
}
