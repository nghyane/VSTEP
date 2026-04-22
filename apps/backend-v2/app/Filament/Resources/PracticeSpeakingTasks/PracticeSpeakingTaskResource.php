<?php

namespace App\Filament\Resources\PracticeSpeakingTasks;

use App\Filament\Resources\PracticeSpeakingTasks\Pages\CreatePracticeSpeakingTask;
use App\Filament\Resources\PracticeSpeakingTasks\Pages\EditPracticeSpeakingTask;
use App\Filament\Resources\PracticeSpeakingTasks\Pages\ListPracticeSpeakingTasks;
use App\Filament\Resources\PracticeSpeakingTasks\Schemas\PracticeSpeakingTaskForm;
use App\Filament\Resources\PracticeSpeakingTasks\Tables\PracticeSpeakingTasksTable;
use App\Models\PracticeSpeakingTask;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class PracticeSpeakingTaskResource extends Resource
{
    protected static ?string $model = PracticeSpeakingTask::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function form(Schema $schema): Schema
    {
        return PracticeSpeakingTaskForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return PracticeSpeakingTasksTable::configure($table);
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
            'index' => ListPracticeSpeakingTasks::route('/'),
            'create' => CreatePracticeSpeakingTask::route('/create'),
            'edit' => EditPracticeSpeakingTask::route('/{record}/edit'),
        ];
    }
}
