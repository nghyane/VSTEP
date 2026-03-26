import hashlib
from pathlib import Path

import httpx
from redis.asyncio import Redis

from app.config import settings
from app.logger import logger

CACHE_TTL = 86400


def resolve_local_path(url: str) -> Path | None:
    if not settings.storage_path or not "/storage/" in url:
        return None
    relative = url.split("/storage/", 1)[1]
    path = Path(settings.storage_path) / relative
    return path if path.is_file() else None


async def load_audio(url: str) -> bytes:
    local = resolve_local_path(url)
    if local:
        logger.info("reading_local", path=str(local))
        return local.read_bytes()

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


async def transcribe(audio_url: str, redis: Redis) -> str:
    audio = await load_audio(audio_url)

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
        result = data.get("result", {})
        # Deepgram Nova format
        if "results" in result:
            transcript = (
                result["results"]["channels"][0]["alternatives"][0]["transcript"]
            )
        else:
            # Whisper format
            transcript = result.get("text", "")

    await redis.setex(key, CACHE_TTL, transcript)
    logger.info("transcribed", audio_url=audio_url, length=len(transcript))
    return transcript
