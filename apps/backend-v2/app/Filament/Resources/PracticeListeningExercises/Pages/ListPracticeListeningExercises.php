<?php

namespace App\Filament\Resources\PracticeListeningExercises\Pages;

use App\Filament\Resources\PracticeListeningExercises\PracticeListeningExerciseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPracticeListeningExercises extends ListRecords
{
    protected static string $resource = PracticeListeningExerciseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
