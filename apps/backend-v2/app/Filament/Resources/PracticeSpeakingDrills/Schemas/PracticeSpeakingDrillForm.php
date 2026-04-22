<?php

namespace App\Filament\Resources\PracticeSpeakingDrills\Schemas;

use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PracticeSpeakingDrillForm
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
                TextInput::make('level')
                    ->required(),
                TextInput::make('estimated_minutes')
                    ->required()
                    ->numeric(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
