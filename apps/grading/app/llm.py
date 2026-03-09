"""LLM client — Cloudflare Workers AI (primary) + OpenAI-compatible (fallback).

Uses official Cloudflare SDK for primary, httpx for OpenAI-compatible fallback.
"""

import json

import httpx
from cloudflare import AsyncCloudflare

from app.config import settings
from app.logger import logger


class LLMError(Exception):
    pass


_cf_client: AsyncCloudflare | None = None


def _get_cf_client() -> AsyncCloudflare:
    global _cf_client
    if _cf_client is None:
        _cf_client = AsyncCloudflare(api_token=settings.llm_api_key)
    return _cf_client


async def _call_cloudflare(
    messages: list[dict],
    model: str,
    account_id: str,
    **_kwargs,
) -> str:
    client = _get_cf_client()
    result = await client.ai.run(
        model_name=model,
        account_id=account_id,
        messages=messages,
    )
    content = result.get("response", "") if isinstance(result, dict) else result
    if isinstance(content, dict):
        return json.dumps(content)
    return content or ""


async def _call_openai(
    messages: list[dict],
    model: str,
    api_base: str,
    api_key: str,
    timeout: int,
) -> str:
    url = f"{api_base}/chat/completions"
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={"model": model, "messages": messages},
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, dict):
            return json.dumps(content)
        return content


async def complete(messages: list[dict]) -> str:
    """Call LLM with automatic fallback. Returns raw string content."""
    last_error: Exception | None = None

    # Primary
    model = settings.llm_model
    for attempt in range(1, settings.llm_retries + 1):
        try:
            if model.startswith("cloudflare/"):
                return await _call_cloudflare(
                    messages=messages,
                    model=model.removeprefix("cloudflare/"),
                    account_id=settings.llm_account_id,
                )
            else:
                return await _call_openai(
                    messages=messages,
                    model=model.removeprefix("openai/"),
                    api_base=settings.llm_api_base,
                    api_key=settings.llm_api_key,
                    timeout=settings.llm_timeout,
                )
        except Exception as e:
            last_error = e
            logger.warning("LLM primary failed", model=model, attempt=attempt, error=str(e))

    # Fallback
    if settings.llm_fallback_model:
        fb = settings.llm_fallback_model
        for attempt in range(1, settings.llm_retries + 1):
            try:
                if fb.startswith("cloudflare/"):
                    return await _call_cloudflare(
                        messages=messages,
                        model=fb.removeprefix("cloudflare/"),
                        account_id=settings.llm_fallback_account_id or settings.llm_account_id,
                    )
                else:
                    return await _call_openai(
                        messages=messages,
                        model=fb.removeprefix("openai/"),
                        api_base=settings.llm_fallback_api_base or settings.llm_api_base,
                        api_key=settings.llm_fallback_api_key or settings.llm_api_key,
                        timeout=settings.llm_timeout,
                    )
            except Exception as e:
                last_error = e
                logger.warning("LLM fallback failed", model=fb, attempt=attempt, error=str(e))

    raise LLMError(f"All LLM providers failed: {last_error}")
