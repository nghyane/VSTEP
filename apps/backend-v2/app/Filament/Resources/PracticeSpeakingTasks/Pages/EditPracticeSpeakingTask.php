<?php

namespace App\Filament\Resources\PracticeSpeakingTasks\Pages;

use App\Filament\Resources\PracticeSpeakingTasks\PracticeSpeakingTaskResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPracticeSpeakingTask extends EditRecord
{
    protected static string $resource = PracticeSpeakingTaskResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
