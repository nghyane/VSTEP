<?php

namespace App\Filament\Resources\PracticeReadingExercises\Pages;

use App\Filament\Resources\PracticeReadingExercises\PracticeReadingExerciseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPracticeReadingExercises extends ListRecords
{
    protected static string $resource = PracticeReadingExerciseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
