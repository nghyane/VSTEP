<?php

namespace App\Filament\Resources\PracticeListeningExercises;

use App\Filament\Resources\PracticeListeningExercises\Pages\CreatePracticeListeningExercise;
use App\Filament\Resources\PracticeListeningExercises\Pages\EditPracticeListeningExercise;
use App\Filament\Resources\PracticeListeningExercises\Pages\ListPracticeListeningExercises;
use App\Filament\Resources\PracticeListeningExercises\Schemas\PracticeListeningExerciseForm;
use App\Filament\Resources\PracticeListeningExercises\Tables\PracticeListeningExercisesTable;
use App\Models\PracticeListeningExercise;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PracticeListeningExerciseResource extends Resource
{
    protected static ?string $model = PracticeListeningExercise::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PracticeListeningExerciseForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PracticeListeningExercisesTable::configure($table);
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
            'index' => ListPracticeListeningExercises::route('/'),
            'create' => CreatePracticeListeningExercise::route('/create'),
            'edit' => EditPracticeListeningExercise::route('/{record}/edit'),
        ];
    }
}
