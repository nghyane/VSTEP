<?php

namespace App\Filament\Resources\GrammarPoints\Pages;

use App\Filament\Resources\GrammarPoints\GrammarPointResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListGrammarPoints extends ListRecords
{
    protected static string $resource = GrammarPointResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
