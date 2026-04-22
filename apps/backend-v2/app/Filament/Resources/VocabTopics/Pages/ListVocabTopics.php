<?php

namespace App\Filament\Resources\VocabTopics\Pages;

use App\Filament\Resources\VocabTopics\VocabTopicResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListVocabTopics extends ListRecords
{
    protected static string $resource = VocabTopicResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
