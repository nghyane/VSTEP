<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Schemas;

use App\Enums\Role;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('full_name')
                        ->label('Họ tên')
                        ->required()
                        ->columnSpan(2),

                    TextInput::make('email')
                        ->label('Email')
                        ->email()
                        ->required()
                        ->unique(ignoreRecord: true),

                    Select::make('role')
                        ->label('Vai trò')
                        ->options(Role::class)
                        ->default('learner')
                        ->required(),

                    TextInput::make('password')
                        ->label('Mật khẩu')
                        ->password()
                        ->required(fn (string $operation) => $operation === 'create')
                        ->dehydrated(fn (?string $state) => filled($state))
                        ->placeholder('Để trống nếu không đổi'),
                ]),
            ]);
    }
}
