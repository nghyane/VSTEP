<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/internal/e2e-demo', function () {
    return view('internal.e2e-demo');
});
