<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('sessions:abandon-expired')->everyFifteenMinutes();
