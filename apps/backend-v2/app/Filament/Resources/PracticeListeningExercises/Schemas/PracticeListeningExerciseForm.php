<?php

namespace App\Filament\Resources\PracticeListeningExercises\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PracticeListeningExerciseForm
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
                TextInput::make('audio_url')
                    ->url(),
                Textarea::make('transcript')
                    ->required()
                    ->columnSpanFull(),
                Textarea::make('vietnamese_transcript')
                    ->columnSpanFull(),
                TextInput::make('word_timestamps'),
                TextInput::make('keywords'),
                TextInput::make('estimated_minutes')
                    ->required()
                    ->numeric(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
