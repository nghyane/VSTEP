<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JsonUtf8
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $response->setEncodingOptions($response->getEncodingOptions() | JSON_UNESCAPED_UNICODE);

            $contentType = $response->headers->get('Content-Type');

            if ($contentType !== null && ! str_contains(strtolower($contentType), 'charset=')) {
                $response->headers->set('Content-Type', $contentType.'; charset=UTF-8');
            }
        }

        return $response;
    }
}
