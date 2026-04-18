<?php

use App\Jobs\ForceSubmitExpiredExams;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ForceSubmitExpiredExams)->everyFiveMinutes();
