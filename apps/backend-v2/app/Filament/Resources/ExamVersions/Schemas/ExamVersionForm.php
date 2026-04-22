<?php

namespace App\Filament\Resources\ExamVersions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ExamVersionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('exam_id')
                    ->relationship('exam', 'title')
                    ->required(),
                TextInput::make('version_number')
                    ->required()
                    ->numeric(),
                DateTimePicker::make('published_at'),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
