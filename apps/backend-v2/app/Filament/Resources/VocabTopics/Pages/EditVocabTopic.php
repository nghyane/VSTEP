<?php

namespace App\Filament\Resources\VocabTopics\Pages;

use App\Filament\Resources\VocabTopics\VocabTopicResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditVocabTopic extends EditRecord
{
    protected static string $resource = VocabTopicResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
