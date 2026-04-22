<?php

namespace App\Filament\Resources\PracticeSpeakingDrills;

use App\Filament\Resources\PracticeSpeakingDrills\Pages\CreatePracticeSpeakingDrill;
use App\Filament\Resources\PracticeSpeakingDrills\Pages\EditPracticeSpeakingDrill;
use App\Filament\Resources\PracticeSpeakingDrills\Pages\ListPracticeSpeakingDrills;
use App\Filament\Resources\PracticeSpeakingDrills\Schemas\PracticeSpeakingDrillForm;
use App\Filament\Resources\PracticeSpeakingDrills\Tables\PracticeSpeakingDrillsTable;
use App\Models\PracticeSpeakingDrill;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PracticeSpeakingDrillResource extends Resource
{
    protected static ?string $model = PracticeSpeakingDrill::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PracticeSpeakingDrillForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PracticeSpeakingDrillsTable::configure($table);
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
            'index' => ListPracticeSpeakingDrills::route('/'),
            'create' => CreatePracticeSpeakingDrill::route('/create'),
            'edit' => EditPracticeSpeakingDrill::route('/{record}/edit'),
        ];
    }
}
