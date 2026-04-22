<?php

namespace App\Filament\Resources\PracticeReadingExercises\Pages;

use App\Filament\Resources\PracticeReadingExercises\PracticeReadingExerciseResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPracticeReadingExercise extends EditRecord
{
    protected static string $resource = PracticeReadingExerciseResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
