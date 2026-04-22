<?php

declare(strict_types=1);

namespace App\Filament\Resources\Exams\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class ExamsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Tên đề thi')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),
                TextColumn::make('source_school')
                    ->label('Nguồn')
                    ->searchable(),
                TextColumn::make('total_duration_minutes')
                    ->label('Thời gian')
                    ->suffix(' phút')
                    ->sortable(),
                TextColumn::make('versions_count')
                    ->label('Phiên bản')
                    ->counts('versions')
                    ->sortable(),
                IconColumn::make('is_published')
                    ->label('Xuất bản')
                    ->boolean(),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                TernaryFilter::make('is_published')
                    ->label('Trạng thái')
                    ->trueLabel('Đã xuất bản')
                    ->falseLabel('Bản nháp')
                    ->placeholder('Tất cả'),
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
