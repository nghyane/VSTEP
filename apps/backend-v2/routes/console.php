<?php

use App\Jobs\ForceSubmitExpiredExams;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ForceSubmitExpiredExams)->everyFiveMinutes();
Schedule::command('payments:expire-pending')->everyMinute();
Schedule::command('vstep:study-reminder')->dailyAt('09:00');
