<?php

namespace App\Filament\Resources\ExamVersions\Pages;

use App\Filament\Resources\ExamVersions\ExamVersionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditExamVersion extends EditRecord
{
    protected static string $resource = ExamVersionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
