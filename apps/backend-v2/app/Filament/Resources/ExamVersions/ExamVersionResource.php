<?php

namespace App\Filament\Resources\ExamVersions;

use App\Filament\Resources\ExamVersions\Pages\CreateExamVersion;
use App\Filament\Resources\ExamVersions\Pages\EditExamVersion;
use App\Filament\Resources\ExamVersions\Pages\ListExamVersions;
use App\Filament\Resources\ExamVersions\Schemas\ExamVersionForm;
use App\Filament\Resources\ExamVersions\Tables\ExamVersionsTable;
use App\Models\ExamVersion;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ExamVersionResource extends Resource
{
    protected static ?string $model = ExamVersion::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return ExamVersionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ExamVersionsTable::configure($table);
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
            'index' => ListExamVersions::route('/'),
            'create' => CreateExamVersion::route('/create'),
            'edit' => EditExamVersion::route('/{record}/edit'),
        ];
    }
}
