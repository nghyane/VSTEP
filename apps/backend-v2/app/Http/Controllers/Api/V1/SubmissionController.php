<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\SubmissionResource;
use App\Services\SubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(
        private readonly SubmissionService $service,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        return SubmissionResource::collection(
            $this->service->list($user->id, $request->query(), $user->role->is(Role::Admin)),
        );
    }

    public function show(Request $request, string $id)
    {
        $user = $request->user();

        return new SubmissionResource(
            $this->service->find($id, $user->id, $user->role->is(Role::Admin)),
        );
    }
}
