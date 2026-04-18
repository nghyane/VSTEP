<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\ProfileCreated;
use App\Models\Profile;
use App\Models\ProfileOnboardingResponse;
use App\Models\ProfileResetEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Profile lifecycle: create, update, reset, delete, onboarding save.
 *
 * Rule: wallet (coin_transactions), enrollments KHÔNG bị xóa khi reset.
 * Phase 1 chỉ wipe learning state (SRS, mastery, activity) — tables này sẽ
 * được tạo ở các slice sau. Reset event log vẫn ghi snapshot cho audit.
 */
class ProfileService
{
    /**
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $data
     */
    public function createInitialProfile(User $user, array $data): Profile
    {
        return $this->createProfile($user, $data, isInitial: true);
    }

    /**
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $data
     */
    public function createAdditionalProfile(User $user, array $data): Profile
    {
        return $this->createProfile($user, $data, isInitial: false);
    }

    /**
     * @return Collection<int,Profile>
     */
    public function listForAccount(User $user): Collection
    {
        return $user->profiles()->orderBy('created_at')->get();
    }

    /**
     * @param  array{nickname?:string,target_level?:string,target_deadline?:string,entry_level?:string|null}  $data
     */
    public function update(Profile $profile, array $data): Profile
    {
        $this->assertNicknameUnique($profile->account_id, $data['nickname'] ?? null, exceptId: $profile->id);

        $profile->fill($data);
        $profile->save();

        return $profile->refresh();
    }

    /**
     * Delete profile. Không cho delete profile cuối của account.
     */
    public function delete(Profile $profile): void
    {
        $remaining = Profile::query()
            ->where('account_id', $profile->account_id)
            ->where('id', '!=', $profile->id)
            ->count();

        if ($remaining === 0) {
            throw ValidationException::withMessages([
                'profile' => ['Cannot delete the last profile of an account.'],
            ]);
        }

        $profile->delete();
    }

    /**
     * Reset profile learning data. Wallet + enrollments giữ nguyên.
     * Phase 1 chỉ log event; wipe actual data tables sẽ implement ở slice sau.
     *
     * @param  array<string,int>  $snapshot  Counts pre-wipe cho audit log.
     */
    public function reset(Profile $profile, ?string $reason, array $snapshot = []): ProfileResetEvent
    {
        return DB::transaction(function () use ($profile, $reason, $snapshot) {
            // Phase 1: learning state tables chưa tồn tại. Khi có, wipe ở đây.
            // Ví dụ: profile_vocab_srs_states, profile_grammar_mastery, profile_daily_activity, profile_streak_state, profile_chart_cache.

            return ProfileResetEvent::create([
                'profile_id' => $profile->id,
                'reason' => $reason,
                'wiped_entities' => $snapshot,
                'reset_at' => now(),
            ]);
        });
    }

    /**
     * @param  array{weaknesses:array<int,string>,motivation?:string|null,raw_answers:array<string,mixed>}  $data
     */
    public function saveOnboardingResponse(Profile $profile, array $data): ProfileOnboardingResponse
    {
        return ProfileOnboardingResponse::updateOrCreate(
            ['profile_id' => $profile->id],
            [
                'weaknesses' => $data['weaknesses'],
                'motivation' => $data['motivation'] ?? null,
                'raw_answers' => $data['raw_answers'],
                'completed_at' => now(),
            ],
        );
    }

    /**
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $data
     */
    private function createProfile(User $user, array $data, bool $isInitial): Profile
    {
        $this->assertNicknameUnique($user->id, $data['nickname']);

        // Only one initial profile per account (app-level guard).
        if ($isInitial && $user->profiles()->where('is_initial_profile', true)->exists()) {
            $isInitial = false;
        }

        return tap(Profile::create([
            'account_id' => $user->id,
            'nickname' => $data['nickname'],
            'target_level' => $data['target_level'],
            'target_deadline' => $data['target_deadline'],
            'entry_level' => $data['entry_level'] ?? null,
            'is_initial_profile' => $isInitial,
        ]), function (Profile $profile): void {
            ProfileCreated::dispatch($profile);
        });
    }

    private function assertNicknameUnique(string $accountId, ?string $nickname, ?string $exceptId = null): void
    {
        if ($nickname === null) {
            return;
        }

        $query = Profile::query()
            ->where('account_id', $accountId)
            ->where('nickname', $nickname);

        if ($exceptId !== null) {
            $query->where('id', '!=', $exceptId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'nickname' => ['Nickname already in use within this account.'],
            ]);
        }
    }
}
