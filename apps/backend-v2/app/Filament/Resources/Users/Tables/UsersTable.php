<?php

declare(strict_types=1);

namespace App\Filament\Resources\Users\Tables;

use App\Enums\Role;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('full_name')
                    ->label('Họ tên')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('email')
                    ->label('Email')
                    ->searchable(),
                TextColumn::make('role')
                    ->label('Vai trò')
                    ->badge()
                    ->sortable(),
                TextColumn::make('profiles_count')
                    ->label('Profiles')
                    ->counts('profiles')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('role')
                    ->label('Vai trò')
                    ->options(Role::class),
            ])
            ->recordActions([
                EditAction::make()->label('Sửa'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()->label('Xóa'),
                ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->striped();
    }
}
