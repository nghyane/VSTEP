<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PracticeSpeakingConversationSession;
use App\Models\User;

final class PracticeSpeakingConversationSessionPolicy
{
    public function view(User $user, PracticeSpeakingConversationSession $session): bool
    {
        return $this->owns($user, $session);
    }

    public function update(User $user, PracticeSpeakingConversationSession $session): bool
    {
        return $this->owns($user, $session);
    }

    private function owns(User $user, PracticeSpeakingConversationSession $session): bool
    {
        return $user->active_profile_id !== null
            && $session->profile_id === $user->active_profile_id;
    }
}
