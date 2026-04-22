<?php

namespace App\Filament\Resources\PracticeSpeakingTasks\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PracticeSpeakingTaskForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('slug')
                    ->required(),
                TextInput::make('title')
                    ->required(),
                TextInput::make('part')
                    ->required()
                    ->numeric(),
                TextInput::make('task_type')
                    ->required(),
                TextInput::make('content')
                    ->required(),
                TextInput::make('estimated_minutes')
                    ->required()
                    ->numeric(),
                TextInput::make('speaking_seconds')
                    ->required()
                    ->numeric(),
                Toggle::make('is_published')
                    ->required(),
            ]);
    }
}
