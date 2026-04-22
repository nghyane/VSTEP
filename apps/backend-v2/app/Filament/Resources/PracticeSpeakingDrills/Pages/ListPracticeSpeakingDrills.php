<?php

namespace App\Filament\Resources\PracticeSpeakingDrills\Pages;

use App\Filament\Resources\PracticeSpeakingDrills\PracticeSpeakingDrillResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPracticeSpeakingDrills extends ListRecords
{
    protected static string $resource = PracticeSpeakingDrillResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
