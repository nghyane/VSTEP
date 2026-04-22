<?php

declare(strict_types=1);
use App\Services\GradingService;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$service = $app->make(GradingService::class);
$reflection = new ReflectionClass($service);

var_dump(get_class($service));
var_dump($reflection->getFileName());
var_dump($reflection->hasMethod('callLlm'));
var_dump(array_map(fn ($m) => $m->getName(), $reflection->getMethods()));
