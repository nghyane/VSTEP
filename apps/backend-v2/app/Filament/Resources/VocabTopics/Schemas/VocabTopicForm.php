<?php

declare(strict_types=1);

namespace App\Filament\Resources\VocabTopics\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;

class VocabTopicForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('name')
                        ->label('Tên chủ đề')
                        ->required()
                        ->placeholder('VD: Education & Learning')
                        ->columnSpan(2),

                    TextInput::make('slug')
                        ->label('Slug')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->placeholder('education-learning'),

                    Select::make('level')
                        ->label('Trình độ')
                        ->required()
                        ->options([
                            'B1' => 'B1',
                            'B2' => 'B2',
                            'C1' => 'C1',
                        ]),

                    Textarea::make('description')
                        ->label('Mô tả')
                        ->rows(2)
                        ->columnSpan(2),

                    TextInput::make('icon_key')
                        ->label('Icon key')
                        ->placeholder('education'),

                    TextInput::make('display_order')
                        ->label('Thứ tự')
                        ->numeric()
                        ->default(0),

                    Toggle::make('is_published')
                        ->label('Xuất bản')
                        ->default(true),
                ]),
            ]);
    }
}
