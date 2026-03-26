<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PresignUploadRequest;
use App\Services\UploadService;

class UploadController extends Controller
{
    public function __construct(
        private readonly UploadService $service,
    ) {}

    public function presign(PresignUploadRequest $request)
    {
        $data = $this->service->presign(
            $request->user()->id,
            $request->validated('content_type'),
        );

        return response()->json(['data' => $data]);
    }
}
