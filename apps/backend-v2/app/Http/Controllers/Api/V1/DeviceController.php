<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Device\RegisterDeviceRequest;
use App\Http\Resources\DeviceResource;
use App\Models\Device;
use App\Services\DeviceService;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class DeviceController extends Controller
{
    public function __construct(
        private readonly DeviceService $service,
    ) {}

    public function store(RegisterDeviceRequest $request)
    {
        $device = $this->service->create(
            $request->user()->id,
            $request->validated(),
        );

        return (new DeviceResource($device))->response()->setStatusCode(201);
    }

    #[Authorize('delete', 'device')]
    public function destroy(Device $device)
    {
        $this->service->delete($device);

        return response()->json(['data' => ['id' => $device->id]]);
    }
}
