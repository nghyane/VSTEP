<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('sessions:abandon-expired')->everyFifteenMinutes();
Schedule::command('sessions:reconcile-results')->hourly();
