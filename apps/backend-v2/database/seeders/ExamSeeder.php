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

        // Group question IDs by skill → level
        $bySkillLevel = [];
        foreach (Skill::cases() as $skill) {
            $bySkillLevel[$skill->value] = Question::where('skill', $skill)
                ->where('is_active', true)
                ->get()
                ->groupBy(fn ($q) => $q->level->value)
                ->map(fn ($qs) => $qs->pluck('id')->all());
        }

        // ── Practice exams per level (listening + reading only) ──

        foreach (Level::cases() as $level) {
            $sections = [];

            foreach ([Skill::Listening, Skill::Reading] as $skill) {
                $ids = $bySkillLevel[$skill->value]->get($level->value, []);
                if ($ids) {
                    $sections[] = ['skill' => $skill->value, 'question_ids' => $ids];
                }
            }

            if (empty($sections)) {
                continue;
            }

            Exam::updateOrCreate(
                ['title' => "VSTEP Practice {$level->value}", 'type' => ExamType::Practice],
                [
                    'level' => $level,
                    'duration_minutes' => 60,
                    'blueprint' => $sections,
                    'description' => "Đề luyện tập VSTEP trình độ {$level->value} — Listening & Reading",
                    'is_active' => true,
                    'created_by' => $admin?->id,
                ],
            );
        }

        // ── Mock exams per level (full 4 skills) ──

        foreach ([Level::B1, Level::B2] as $level) {
            $sections = [];

            foreach (Skill::cases() as $skill) {
                $ids = $bySkillLevel[$skill->value]->get($level->value, []);
                if ($ids) {
                    $sections[] = ['skill' => $skill->value, 'question_ids' => $ids];
                }
            }

            if (count($sections) < 2) {
                continue;
            }

            Exam::updateOrCreate(
                ['title' => "VSTEP Mock {$level->value}", 'type' => ExamType::Mock],
                [
                    'level' => $level,
                    'duration_minutes' => 180,
                    'blueprint' => $sections,
                    'description' => "Đề thi thử VSTEP trình độ {$level->value} — 4 kỹ năng",
                    'is_active' => true,
                    'created_by' => $admin?->id,
                ],
            );
        }

        // ── Placement exam (mix levels) ──

        $placementSections = [];
        foreach ([Skill::Listening, Skill::Reading] as $skill) {
            $allIds = $bySkillLevel[$skill->value]->flatten()->all();
            if ($allIds) {
                $placementSections[] = ['skill' => $skill->value, 'question_ids' => $allIds];
            }
        }

        if ($placementSections) {
            Exam::updateOrCreate(
                ['title' => 'VSTEP Placement Test', 'type' => ExamType::Placement],
                [
                    'level' => Level::B1,
                    'duration_minutes' => 45,
                    'blueprint' => $placementSections,
                    'description' => 'Bài test xếp lớp — đánh giá trình độ Listening & Reading',
                    'is_active' => true,
                    'created_by' => $admin?->id,
                ],
            );
        }
    }
}
