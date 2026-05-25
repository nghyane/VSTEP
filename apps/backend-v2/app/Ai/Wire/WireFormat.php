<?php

declare(strict_types=1);

namespace App\Ai\Wire;

use Illuminate\Http\Client\PendingRequest;

/**
 * Strategy interface — each wire format implements this.
 * Pure HTTP formatting, no business logic.
 */
interface WireFormat
{
    public function send(PendingRequest $http, WireRequest $request): WireResponse;
}
