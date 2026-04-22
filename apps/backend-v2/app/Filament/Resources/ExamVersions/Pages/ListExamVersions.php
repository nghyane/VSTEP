<?php

namespace App\Filament\Resources\ExamVersions\Pages;

use App\Filament\Resources\ExamVersions\ExamVersionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListExamVersions extends ListRecords
{
    protected static string $resource = ExamVersionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
