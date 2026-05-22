<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSystemConfigRequest;
use App\Models\SystemConfig;
use App\Services\Admin\SystemConfigService;
use App\Support\SystemConfigSchemas;
use Illuminate\Http\JsonResponse;

final class SystemConfigController extends Controller
{
    public function __construct(private readonly SystemConfigService $service) {}

    public function index(): JsonResponse
    {
        $configs = $this->service->list()->map(fn ($c) => $this->present($c));

        return response()->json(['data' => $configs]);
    }

    public function show(string $key): JsonResponse
    {
        return response()->json(['data' => $this->present($this->service->show($key))]);
    }

    public function update(UpdateSystemConfigRequest $request, string $key): JsonResponse
    {
        $config = $this->service->update($key, $request->input('value'));

        return response()->json(['data' => $this->present($config)]);
    }

    /**
     * @return array<string,mixed>
     */
    private function present(SystemConfig $c): array
    {
        return [
            'key' => $c->key,
            'value' => $c->value,
            'description' => $c->description,
            'updated_at' => $c->updated_at,
            'schema' => SystemConfigSchemas::for($c->key),
        ];
    }
}
