<?php

namespace App\Filament\Resources\VocabTopics;

use App\Filament\Resources\VocabTopics\Pages\CreateVocabTopic;
use App\Filament\Resources\VocabTopics\Pages\EditVocabTopic;
use App\Filament\Resources\VocabTopics\Pages\ListVocabTopics;
use App\Filament\Resources\VocabTopics\Schemas\VocabTopicForm;
use App\Filament\Resources\VocabTopics\Tables\VocabTopicsTable;
use App\Models\VocabTopic;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class VocabTopicResource extends Resource
{
    protected static ?string $model = VocabTopic::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return VocabTopicForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return VocabTopicsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListVocabTopics::route('/'),
            'create' => CreateVocabTopic::route('/create'),
            'edit' => EditVocabTopic::route('/{record}/edit'),
        ];
    }
}
