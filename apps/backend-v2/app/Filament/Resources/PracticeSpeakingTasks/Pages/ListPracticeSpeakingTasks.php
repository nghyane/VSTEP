<?php

namespace App\Filament\Resources\PracticeSpeakingTasks\Pages;

use App\Filament\Resources\PracticeSpeakingTasks\PracticeSpeakingTaskResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPracticeSpeakingTasks extends ListRecords
{
    protected static string $resource = PracticeSpeakingTaskResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
