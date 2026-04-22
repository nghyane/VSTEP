<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Role;
use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasName;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['full_name', 'email', 'password', 'role', 'avatar_key'])]
#[Hidden(['password'])]
class User extends Authenticatable implements FilamentUser, HasName, JWTSubject
{
    use HasFactory;
    use HasUuids;

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->role === Role::Admin || $this->role === Role::Staff;
    }

    public function getFilamentName(): string
    {
        return $this->full_name ?? $this->email;
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    public function refreshTokens(): HasMany
    {
        return $this->hasMany(RefreshToken::class);
    }

    /**
     * Profiles owned by this account. Only learners have profiles.
     * Admin/teacher users return empty collection.
     */
    public function profiles(): HasMany
    {
        return $this->hasMany(Profile::class, 'account_id');
    }

    public function initialProfile(): ?Profile
    {
        return $this->profiles()->where('is_initial_profile', true)->first();
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role->value,
            'active_profile_id' => null,
        ];
    }
}
