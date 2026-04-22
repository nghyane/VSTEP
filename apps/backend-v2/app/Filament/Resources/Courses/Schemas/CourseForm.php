<?php

namespace App\Filament\Resources\Courses\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class CourseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('slug')
                    ->required(),
                TextInput::make('title')
                    ->required(),
                TextInput::make('target_level')
                    ->required(),
                TextInput::make('target_exam_school'),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('price_coins')
                    ->required()
                    ->numeric(),
                TextInput::make('bonus_coins')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('max_slots')
                    ->required()
                    ->numeric(),
                TextInput::make('max_slots_per_student')
                    ->required()
                    ->numeric()
                    ->default(2),
                DatePicker::make('start_date')
                    ->required(),
                DatePicker::make('end_date')
                    ->required(),
                TextInput::make('required_full_tests')
                    ->required()
                    ->numeric(),
                TextInput::make('commitment_window_days')
                    ->required()
                    ->numeric(),
                TextInput::make('exam_cooldown_days')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('livestream_url')
                    ->url(),
                Select::make('teacher_id')
                    ->relationship('teacher', 'id')
                    ->required(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
