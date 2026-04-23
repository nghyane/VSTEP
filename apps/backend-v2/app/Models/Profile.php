<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Learner's learning unit. 1 user có n profiles.
 * Wallet (xu), progress, streak, enrollments đều gắn vào profile.
 */
#[Fillable([
    'account_id',
    'nickname',
    'target_level',
    'target_deadline',
    'entry_level',
    'avatar_color',
    'is_initial_profile',
])]
class Profile extends BaseModel
{
    protected function casts(): array
    {
        return [
            'target_deadline' => 'date',
            'is_initial_profile' => 'boolean',
        ];
    }

    // ── Account & Onboarding ──

    public function account(): BelongsTo
    {
        return $this->belongsTo(User::class, 'account_id');
    }

    public function onboardingResponse(): HasOne
    {
        return $this->hasOne(ProfileOnboardingResponse::class)->latestOfMany('version');
    }

    public function onboardingResponses(): HasMany
    {
        return $this->hasMany(ProfileOnboardingResponse::class);
    }

    public function resetEvents(): HasMany
    {
        return $this->hasMany(ProfileResetEvent::class);
    }

    // ── Progress & Activity ──

    public function streakState(): HasOne
    {
        return $this->hasOne(ProfileStreakState::class);
    }

    public function streakLogs(): HasMany
    {
        return $this->hasMany(ProfileStreakLog::class);
    }

    // ── Teachers ──

    public function teacherReviews(): HasMany
    {
        return $this->hasManyThrough(
            TeacherReview::class,
            TeacherBooking::class,
            'profile_id',    // Foreign key on teacher_bookings...
            'booking_id',    // Foreign key on teacher_reviews...
            'id',            // Local key on profiles...
            'id',            // Local key on teacher_bookings...
        );
    }

    public function dailyActivities(): HasMany
    {
        return $this->hasMany(ProfileDailyActivity::class);
    }

    // ── Exams ──

    public function examSessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    // ── Practice ──

    public function practiceSessions(): HasMany
    {
        return $this->hasMany(PracticeSession::class);
    }

    // ── Wallet ──

    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    // ── Notifications ──

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // ── Courses ──

    public function courseEnrollments(): HasMany
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    // ── SRS & Mastery ──

    public function vocabSrsState(): HasMany
    {
        return $this->hasMany(ProfileVocabSrsState::class);
    }

    public function grammarMastery(): HasMany
    {
        return $this->hasMany(ProfileGrammarMastery::class);
    }

    // ── Teachers ──

    public function teacherBookings(): HasMany
    {
        return $this->hasMany(TeacherBooking::class);
    }
}
