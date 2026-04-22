<?php

namespace App\Filament\Resources\PracticeWritingPrompts;

use App\Filament\Resources\PracticeWritingPrompts\Pages\CreatePracticeWritingPrompt;
use App\Filament\Resources\PracticeWritingPrompts\Pages\EditPracticeWritingPrompt;
use App\Filament\Resources\PracticeWritingPrompts\Pages\ListPracticeWritingPrompts;
use App\Filament\Resources\PracticeWritingPrompts\Schemas\PracticeWritingPromptForm;
use App\Filament\Resources\PracticeWritingPrompts\Tables\PracticeWritingPromptsTable;
use App\Models\PracticeWritingPrompt;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PracticeWritingPromptResource extends Resource
{
    protected static ?string $model = PracticeWritingPrompt::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PracticeWritingPromptForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PracticeWritingPromptsTable::configure($table);
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
            'index' => ListPracticeWritingPrompts::route('/'),
            'create' => CreatePracticeWritingPrompt::route('/create'),
            'edit' => EditPracticeWritingPrompt::route('/{record}/edit'),
        ];
    }
}
