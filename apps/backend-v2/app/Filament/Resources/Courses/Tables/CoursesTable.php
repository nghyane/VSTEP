<?php

namespace App\Filament\Resources\Courses\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CoursesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID'),
                TextColumn::make('slug')
                    ->searchable(),
                TextColumn::make('title')
                    ->searchable(),
                TextColumn::make('target_level')
                    ->searchable(),
                TextColumn::make('target_exam_school')
                    ->searchable(),
                TextColumn::make('price_coins')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('bonus_coins')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('max_slots')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('max_slots_per_student')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('start_date')
                    ->date()
                    ->sortable(),
                TextColumn::make('end_date')
                    ->date()
                    ->sortable(),
                TextColumn::make('required_full_tests')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('commitment_window_days')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('exam_cooldown_days')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('livestream_url')
                    ->searchable(),
                TextColumn::make('teacher.id')
                    ->searchable(),
                IconColumn::make('is_published')
                    ->boolean(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
