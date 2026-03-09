import hashlib

import httpx
from redis.asyncio import Redis

from app.config import settings
from app.logger import logger

CACHE_TTL = 86400


async def download(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


async def transcribe(audio_url: str, redis: Redis) -> str:
    audio = await download(audio_url)

    key = f"stt:{hashlib.sha256(audio).hexdigest()}"
    cached = await redis.get(key)
    if cached:
        return cached.decode()

    model = settings.stt_model.removeprefix("cloudflare/")
    url = f"{settings.stt_api_base}/run/{model}"

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.stt_api_key}",
                "Content-Type": "application/octet-stream",
            },
            content=audio,
        )
        response.raise_for_status()
        data = response.json()
        transcript = data.get("result", {}).get("text", "")

    await redis.setex(key, CACHE_TTL, transcript)
    logger.info("transcribed", audio_url=audio_url, length=len(transcript))
    return transcript
