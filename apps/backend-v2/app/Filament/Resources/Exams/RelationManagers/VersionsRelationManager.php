<?php

declare(strict_types=1);

namespace App\Filament\Resources\Exams\RelationManagers;

use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class VersionsRelationManager extends RelationManager
{
    protected static string $relationship = 'versions';

    protected static ?string $title = 'Phiên bản đề';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('version_number')
                ->label('Số phiên bản')
                ->required()
                ->numeric()
                ->default(1),
            Toggle::make('is_active')
                ->label('Đang hoạt động')
                ->default(true),
            DateTimePicker::make('published_at')
                ->label('Ngày xuất bản'),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('version_number')
                    ->label('Phiên bản')
                    ->sortable(),
                IconColumn::make('is_active')
                    ->label('Hoạt động')
                    ->boolean(),
                TextColumn::make('published_at')
                    ->label('Ngày xuất bản')
                    ->date('d/m/Y H:i'),
                TextColumn::make('created_at')
                    ->label('Ngày tạo')
                    ->date('d/m/Y'),
            ])
            ->headerActions([
                CreateAction::make()->label('Thêm phiên bản'),
            ])
            ->recordActions([
                EditAction::make()->label('Sửa'),
                DeleteAction::make()->label('Xóa'),
            ]);
    }
}
