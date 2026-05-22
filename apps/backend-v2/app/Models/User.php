<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['full_name', 'email', 'password', 'role', 'avatar_key', 'avatar_url', 'google_id', 'title', 'bio', 'active_profile_id', 'email_verified_at', 'deactivated_at'])]
#[Hidden(['password'])]
class User extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use HasUuids;

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => Role::class,
            'email_verified_at' => 'datetime',
            'deactivated_at' => 'datetime',
        ];
    }

    /**
     * Normalize email to lowercase at write boundary. Postgres compares
     * case-sensitively; Google ID tokens always return lowercase. Storing
     * lowercase means every lookup (password login, Google linking, unique
     * index, refresh) hits the same canonical form — no whereRaw, no
     * duplicate rows, no case-related account-takeover surface.
     */
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => $value === null ? null : Str::lower($value),
        );
    }

    public function isDeactivated(): bool
    {
        return $this->deactivated_at !== null;
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

    public function activeProfile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'active_profile_id');
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
