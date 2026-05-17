<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Picker dropdown — danh sách giáo viên để gán vào course/slot.
     * Trả tối thiểu để tránh leak PII.
     */
    public function teachers(): JsonResponse
    {
        $teachers = User::query()
            ->where('role', Role::Teacher->value)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'email']);

        return response()->json(['data' => $teachers]);
    }
}
