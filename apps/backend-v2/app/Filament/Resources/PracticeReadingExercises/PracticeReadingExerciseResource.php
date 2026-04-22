<?php

namespace App\Filament\Resources\PracticeReadingExercises;

use App\Filament\Resources\PracticeReadingExercises\Pages\CreatePracticeReadingExercise;
use App\Filament\Resources\PracticeReadingExercises\Pages\EditPracticeReadingExercise;
use App\Filament\Resources\PracticeReadingExercises\Pages\ListPracticeReadingExercises;
use App\Filament\Resources\PracticeReadingExercises\Schemas\PracticeReadingExerciseForm;
use App\Filament\Resources\PracticeReadingExercises\Tables\PracticeReadingExercisesTable;
use App\Models\PracticeReadingExercise;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PracticeReadingExerciseResource extends Resource
{
    protected static ?string $model = PracticeReadingExercise::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PracticeReadingExerciseForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PracticeReadingExercisesTable::configure($table);
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
            'index' => ListPracticeReadingExercises::route('/'),
            'create' => CreatePracticeReadingExercise::route('/create'),
            'edit' => EditPracticeReadingExercise::route('/{record}/edit'),
        ];
    }
}
