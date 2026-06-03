<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role;
use App\Events\ProfileCreated;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * All demo accounts: 2 learners + 1 teacher + 1 staff + 1 admin.
 * Predictable data, idempotent (updateOrCreate).
 */
final class DemoAccountSeeder extends Seeder
{
    private const DEMO_LEARNER_EMAIL = 'learner@vstep.test';

    private const NEW_LEARNER_EMAIL = 'learner2@vstep.test';

    private const TEACHER_EMAIL = 'teacher@vstep.test';

    private const STAFF_EMAIL = 'staff@vstep.test';

    private const ADMIN_EMAIL = 'admin@vstep.test';

    private const DEMO_PASSWORD = 'password';

    public function run(): void
    {
        // ── Teacher ──
        $teacher = $this->createUser(
            email: self::TEACHER_EMAIL,
            name: 'Demo Teacher',
            role: Role::Teacher,
            title: 'Tiến sĩ Ngôn ngữ Anh · VSTEP C1',
            bio: '12 năm giảng dạy ĐH, chuyên luyện thi VSTEP B2/C1. Chấm thi chính thức tại ĐHSP Hà Nội.',
        );

        // ── Staff ──
        $this->createUser(
            email: self::STAFF_EMAIL,
            name: 'Demo Staff',
            role: Role::Staff,
        );

        // ── Admin ──
        $this->createUser(
            email: self::ADMIN_EMAIL,
            name: 'Demo Admin',
            role: Role::Admin,
        );

        // ── Main Learner (full demo data) ──
        $learner = $this->createUser(
            email: self::DEMO_LEARNER_EMAIL,
            name: 'Demo Learner',
            role: Role::Learner,
        );
        $profile = $this->createProfile(
            user: $learner,
            nickname: 'Minh',
            targetLevel: 'B2',
            entryLevel: 'B1',
            targetDeadline: now()->addYear(),
            isInitial: true,
        );

        // Extra profiles for risk student demo (same learner account)
        foreach (self::EXTRA_PROFILES as $cfg) {
            $this->createProfile(
                user: $learner,
                nickname: $cfg['nickname'],
                targetLevel: $cfg['target_level'],
                entryLevel: $cfg['entry_level'],
                targetDeadline: now()->addDays($cfg['target_deadline_days']),
                isInitial: false,
            );
        }

        // ── New Learner (onboarding demo) ──
        $newLearner = $this->createUser(
            email: self::NEW_LEARNER_EMAIL,
            name: 'New Learner',
            role: Role::Learner,
        );
        $this->createProfile(
            user: $newLearner,
            nickname: 'Tester',
            targetLevel: 'B1',
            entryLevel: 'A2',
            targetDeadline: now()->addMonths(6),
            isInitial: true,
        );

        $this->command?->info("Demo accounts seeded: 2 learners ({$profile->nickname} + Tester), teacher, staff, admin.");
    }

    /** @var list<array{nickname: string, target_level: string, entry_level: string, target_deadline_days: int}> */
    private const EXTRA_PROFILES = [
        ['nickname' => 'weak_writer', 'target_level' => 'B2', 'entry_level' => 'B1', 'target_deadline_days' => 14],
        ['nickname' => 'weak_speaker', 'target_level' => 'B2', 'entry_level' => 'B1', 'target_deadline_days' => 60],
        ['nickname' => 'inactive_student', 'target_level' => 'B1', 'entry_level' => 'A2', 'target_deadline_days' => 30],
    ];

    private function createUser(string $email, string $name, Role $role, ?string $title = null, ?string $bio = null): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'full_name' => $name,
                'role' => $role,
                'password' => Hash::make(self::DEMO_PASSWORD),
                'title' => $title,
                'bio' => $bio,
                'email_verified_at' => now(),
            ],
        );

        return $user;
    }

    private function createProfile(User $user, string $nickname, string $targetLevel, string $entryLevel, \DateTimeInterface|string $targetDeadline, bool $isInitial): Profile
    {
        $profile = Profile::updateOrCreate(
            ['account_id' => $user->id, 'nickname' => $nickname],
            [
                'target_level' => $targetLevel,
                'target_deadline' => $targetDeadline,
                'entry_level' => $entryLevel,
                'is_initial_profile' => $isInitial,
            ],
        );

        if ($isInitial) {
            event(new ProfileCreated($profile));
        }

        return $profile;
    }
}
