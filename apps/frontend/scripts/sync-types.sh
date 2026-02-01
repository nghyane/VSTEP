#!/bin/bash
# sync-types.sh - Fetch OpenAPI from backend

BE_URL=${BE_URL:-http://localhost:3000}

echo "Fetching OpenAPI from $BE_URL..."
curl -s "$BE_URL/swagger/json" -o openapi.json

echo "Generating types..."
bunx openapi-typescript openapi.json -o src/api/types.ts

echo "Done!"
