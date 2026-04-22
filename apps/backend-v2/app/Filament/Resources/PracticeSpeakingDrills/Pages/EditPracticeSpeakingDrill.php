<?php

namespace App\Filament\Resources\PracticeSpeakingDrills\Pages;

use App\Filament\Resources\PracticeSpeakingDrills\PracticeSpeakingDrillResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPracticeSpeakingDrill extends EditRecord
{
    protected static string $resource = PracticeSpeakingDrillResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
