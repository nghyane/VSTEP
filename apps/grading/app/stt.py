import hashlib
import io
import httpx
from litellm import atranscription
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

    # litellm expects file-like object opened in binary mode
    response = await atranscription(
        model=settings.stt_model,
        file=io.BytesIO(audio),
        language="en",
    )
    transcript = response.text or ""

    await redis.setex(key, CACHE_TTL, transcript)
    logger.info("transcribed", audio_url=audio_url, length=len(transcript))
    return transcript
