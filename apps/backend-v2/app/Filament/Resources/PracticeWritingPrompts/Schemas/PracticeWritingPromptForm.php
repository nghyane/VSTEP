<?php

namespace App\Filament\Resources\PracticeWritingPrompts\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PracticeWritingPromptForm
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
                Textarea::make('prompt')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('min_words')
                    ->required()
                    ->numeric(),
                TextInput::make('max_words')
                    ->required()
                    ->numeric(),
                TextInput::make('required_points'),
                TextInput::make('keywords'),
                TextInput::make('sentence_starters'),
                Textarea::make('sample_answer')
                    ->columnSpanFull(),
                TextInput::make('estimated_minutes')
                    ->required()
                    ->numeric(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
