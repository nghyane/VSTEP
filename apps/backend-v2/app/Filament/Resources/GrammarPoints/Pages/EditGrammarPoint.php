<?php

namespace App\Filament\Resources\GrammarPoints\Pages;

use App\Filament\Resources\GrammarPoints\GrammarPointResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditGrammarPoint extends EditRecord
{
    protected static string $resource = GrammarPointResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
