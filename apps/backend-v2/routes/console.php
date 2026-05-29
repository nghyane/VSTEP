<?php

use App\Jobs\ForceSubmitExpiredExams;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ForceSubmitExpiredExams)->everyFiveMinutes();
Schedule::command('vstep:study-reminder')->dailyAt('09:00');
