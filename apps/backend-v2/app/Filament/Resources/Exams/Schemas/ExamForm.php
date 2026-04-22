<?php

declare(strict_types=1);

namespace App\Filament\Resources\Exams\Schemas;

use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Fieldset;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;

class ExamForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('title')
                        ->label('Tên đề thi')
                        ->required()
                        ->placeholder('VD: VSTEP Practice Test 1')
                        ->columnSpan(2),

                    TextInput::make('slug')
                        ->label('Slug (URL)')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->placeholder('vstep-practice-1'),

                    TextInput::make('source_school')
                        ->label('Trường/nguồn')
                        ->placeholder('VD: HNUE, VNU'),

                    TextInput::make('total_duration_minutes')
                        ->label('Thời gian (phút)')
                        ->required()
                        ->numeric()
                        ->default(172)
                        ->suffix('phút'),

                    Toggle::make('is_published')
                        ->label('Đã xuất bản')
                        ->default(false),
                ]),

                Fieldset::make('Phân loại')
                    ->schema([
                        TagsInput::make('tags')
                            ->label('Tags')
                            ->placeholder('Thêm tag...')
                            ->suggestions(['#FullTest', '#B1B2', '#B2C1', '#Demo', '#Mock']),
                    ]),
            ]);
    }
}
