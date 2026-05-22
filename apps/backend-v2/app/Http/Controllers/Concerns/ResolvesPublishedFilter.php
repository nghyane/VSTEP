<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;

trait ResolvesPublishedFilter
{
    /**
     * Resolve is_published query filter into a tri-state value:
     *   - true / false → boolean filter
     *   - null         → no filter (param absent or unparseable)
     */
    protected function resolvePublishedFilter(Request $request): ?bool
    {
        if (! $request->has('is_published')) {
            return null;
        }

        $value = filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

        return $value;
    }
}
