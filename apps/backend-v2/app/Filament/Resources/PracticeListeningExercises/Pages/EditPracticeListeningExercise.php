<?php

namespace App\Filament\Resources\PracticeListeningExercises\Pages;

use App\Filament\Resources\PracticeListeningExercises\PracticeListeningExerciseResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPracticeListeningExercise extends EditRecord
{
    protected static string $resource = PracticeListeningExerciseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
