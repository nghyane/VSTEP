<?php

namespace App\Filament\Resources\SystemConfigs\Pages;

use App\Filament\Resources\SystemConfigs\SystemConfigResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListSystemConfigs extends ListRecords
{
    protected static string $resource = SystemConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
