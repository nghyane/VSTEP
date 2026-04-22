<?php

declare(strict_types=1);

namespace App\Filament\Resources\VocabTopics\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class VocabTopicsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Chủ đề')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('level')
                    ->label('Trình độ')
                    ->badge()
                    ->sortable(),
                TextColumn::make('words_count')
                    ->label('Số từ')
                    ->counts('words')
                    ->sortable(),
                TextColumn::make('display_order')
                    ->label('Thứ tự')
                    ->sortable(),
                IconColumn::make('is_published')
                    ->label('Xuất bản')
                    ->boolean(),
            ])
            ->filters([
                SelectFilter::make('level')
                    ->label('Trình độ')
                    ->options(['B1' => 'B1', 'B2' => 'B2', 'C1' => 'C1']),
            ])
            ->recordActions([
                EditAction::make()->label('Sửa'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make()->label('Xóa'),
                ]),
            ])
            ->defaultSort('display_order')
            ->striped();
    }
}
