<?php

namespace App\Filament\Resources\PracticeWritingPrompts\Pages;

use App\Filament\Resources\PracticeWritingPrompts\PracticeWritingPromptResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListPracticeWritingPrompts extends ListRecords
{
    protected static string $resource = PracticeWritingPromptResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
