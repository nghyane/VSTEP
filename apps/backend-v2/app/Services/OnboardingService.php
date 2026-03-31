<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Confidence;
use App\Enums\ExamType;
use App\Enums\Level;
use App\Enums\PlacementSource;
use App\Enums\SessionStatus;
use App\Enums\StreakDirection;
use App\Enums\VstepBand;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\UserGoal;
use App\Models\UserPlacement;
use App\Models\UserProgress;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OnboardingService
{
    public function __construct(
        private readonly SessionService $sessionService,
    ) {}

    public function status(string $userId): array
    {
        $placement = UserPlacement::where('user_id', $userId)->latest('created_at')->first();
        $hasGoal = UserGoal::where('user_id', $userId)->exists();

        return [
            'completed' => $placement !== null,
            'placement' => $placement ? [
                'source' => $placement->source,
                'confidence' => $placement->confidence,
                'levels' => $placement->levels,
                'estimated_band' => $placement->estimated_band,
            ] : null,
            'has_goal' => $hasGoal,
            'needs_verification' => $placement?->needs_verification ?? false,
        ];
    }

    public function selfAssess(string $userId, array $data): UserPlacement
    {
        $levels = [
            'listening' => $data['listening'],
            'reading' => $data['reading'],
            'writing' => $data['writing'],
            'speaking' => $data['speaking'],
        ];

        return $this->createOnboarding($userId, $levels, $data, PlacementSource::SelfAssess, Confidence::Medium, true);
    }

    public function startPlacement(string $userId): array
    {
        $exam = Exam::where('type', ExamType::Placement)
            ->active()
            ->first();

        if (! $exam) {
            throw ValidationException::withMessages([
                'exam' => ['No placement exam available.'],
            ]);
        }

        $session = $this->sessionService->start($exam, $userId);

        return [
            'session_id' => $session->id,
            'exam_id' => $exam->id,
            'question_count' => $exam->questionCount(),
        ];
    }

    public function completePlacement(string $userId, ExamSession $session, array $data): UserPlacement
    {
        if ($session->user_id !== $userId) {
            throw ValidationException::withMessages([
                'session' => ['Session does not belong to you.'],
            ]);
        }

        if ($session->status !== SessionStatus::Completed) {
            throw ValidationException::withMessages([
                'session' => ['Session has not been completed yet.'],
            ]);
        }

        $session->loadMissing('exam');

        if ($session->exam->type !== ExamType::Placement) {
            throw ValidationException::withMessages([
                'session' => ['Session is not a placement test.'],
            ]);
        }

        if ($session->listening_score === null && $session->reading_score === null) {
            throw ValidationException::withMessages([
                'session' => ['No objective skill scores available from this session.'],
            ]);
        }

        $objectiveAvg = collect([$session->listening_score, $session->reading_score])
            ->filter()
            ->avg();
        $derivedLevel = Level::fromScore($objectiveAvg)->value;

        $levels = [
            'listening' => $session->listening_score !== null ? Level::fromScore($session->listening_score)->value : $derivedLevel,
            'reading' => $session->reading_score !== null ? Level::fromScore($session->reading_score)->value : $derivedLevel,
            'writing' => $derivedLevel,
            'speaking' => $derivedLevel,
        ];

        return $this->createOnboarding($userId, $levels, $data, PlacementSource::Placement, Confidence::High, true);
    }

    public function skip(string $userId, array $data): UserPlacement
    {
        $levels = [
            'listening' => Level::A2->value,
            'reading' => Level::A2->value,
            'writing' => Level::A2->value,
            'speaking' => Level::A2->value,
        ];

        return $this->createOnboarding($userId, $levels, $data, PlacementSource::Skipped, Confidence::Low, true);
    }

    private function createOnboarding(
        string $userId,
        array $levels,
        array $goalData,
        PlacementSource $source,
        Confidence $confidence,
        bool $needsVerification,
    ): UserPlacement {
        return DB::transaction(function () use ($userId, $levels, $goalData, $source, $confidence, $needsVerification) {
            $this->resetOnboarding($userId);

            $targetBand = $goalData['target_band'];

            foreach ($levels as $skill => $level) {
                $levelEnum = $level instanceof Level ? $level : Level::from($level);

                UserProgress::updateOrCreate(
                    ['user_id' => $userId, 'skill' => $skill],
                    [
                        'current_level' => $level,
                        'target_level' => $targetBand,
                        'scaffold_level' => $levelEnum->initialScaffoldLevel(),
                        'streak_count' => 0,
                        'streak_direction' => StreakDirection::Neutral,
                        'attempt_count' => 0,
                    ],
                );
            }

            UserGoal::create([
                'user_id' => $userId,
                'target_band' => $targetBand,
                'deadline' => $goalData['deadline'],
                'daily_study_time_minutes' => $goalData['daily_study_time_minutes'],
            ]);

            return UserPlacement::create([
                'user_id' => $userId,
                'source' => $source,
                'confidence' => $confidence,
                'levels' => $levels,
                'estimated_band' => $this->estimateBand($levels),
                'needs_verification' => $needsVerification,
            ]);
        });
    }

    private function resetOnboarding(string $userId): void
    {
        UserPlacement::where('user_id', $userId)->delete();
        UserGoal::where('user_id', $userId)->delete();
    }

    private function estimateBand(array $levels): ?string
    {
        if (empty($levels)) {
            return null;
        }

        $scores = array_map(fn ($l) => Level::from($l)->score(), $levels);
        $avg = array_sum($scores) / count($scores);

        return match (true) {
            $avg >= 3.5 => VstepBand::C1->value,
            $avg >= 2.5 => VstepBand::B2->value,
            $avg >= 1.5 => VstepBand::B1->value,
            default => null,
        };
    }
}
