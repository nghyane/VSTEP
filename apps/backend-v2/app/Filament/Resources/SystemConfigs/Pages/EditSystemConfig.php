<?php

namespace App\Filament\Resources\SystemConfigs\Pages;

use App\Filament\Resources\SystemConfigs\SystemConfigResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditSystemConfig extends EditRecord
{
    protected static string $resource = SystemConfigResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
