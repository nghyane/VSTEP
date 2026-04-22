<?php

namespace App\Filament\Resources\GrammarPoints;

use App\Filament\Resources\GrammarPoints\Pages\CreateGrammarPoint;
use App\Filament\Resources\GrammarPoints\Pages\EditGrammarPoint;
use App\Filament\Resources\GrammarPoints\Pages\ListGrammarPoints;
use App\Filament\Resources\GrammarPoints\Schemas\GrammarPointForm;
use App\Filament\Resources\GrammarPoints\Tables\GrammarPointsTable;
use App\Models\GrammarPoint;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class GrammarPointResource extends Resource
{
    protected static ?string $model = GrammarPoint::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return GrammarPointForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return GrammarPointsTable::configure($table);
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
            'index' => ListGrammarPoints::route('/'),
            'create' => CreateGrammarPoint::route('/create'),
            'edit' => EditGrammarPoint::route('/{record}/edit'),
        ];
    }
}
