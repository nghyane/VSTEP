<?php

namespace App\Filament\Resources\PracticeWritingPrompts\Pages;

use App\Filament\Resources\PracticeWritingPrompts\PracticeWritingPromptResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPracticeWritingPrompt extends EditRecord
{
    protected static string $resource = PracticeWritingPromptResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
