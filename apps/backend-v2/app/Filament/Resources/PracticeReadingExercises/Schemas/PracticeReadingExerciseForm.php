<?php

namespace App\Filament\Resources\PracticeReadingExercises\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PracticeReadingExerciseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('slug')
                    ->required(),
                TextInput::make('title')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('part')
                    ->required()
                    ->numeric(),
                Textarea::make('passage')
                    ->required()
                    ->columnSpanFull(),
                Textarea::make('vietnamese_translation')
                    ->columnSpanFull(),
                TextInput::make('keywords'),
                TextInput::make('estimated_minutes')
                    ->required()
                    ->numeric(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
