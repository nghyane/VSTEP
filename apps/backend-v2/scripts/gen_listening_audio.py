#!/usr/bin/env python3
"""
Generate MP3 audio + word timestamps from listening transcripts using edge-tts.

- Exam sections: generates audio, updates audio_url
- Practice exercises: generates audio + word_timestamps JSON, updates both

Usage: python3 scripts/gen_listening_audio.py [--force]
Requires: pip install edge-tts psycopg2-binary python-dotenv
"""

import asyncio
import json
import os
import re
import sys
from pathlib import Path

import edge_tts

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

import psycopg2

VOICE_NARRATOR = "en-US-GuyNeural"
VOICE_FEMALE = "en-US-JennyNeural"
VOICE_MALE = "en-US-GuyNeural"

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "storage/app/public/audio/listening"
URL_PREFIX = "/storage/audio/listening"

FORCE = "--force" in sys.argv


def get_db_conn():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_DATABASE", "vstep"),
        user=os.getenv("DB_USERNAME", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def fetch_sections(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, part, display_order, part_title, transcript
            FROM exam_version_listening_sections
            WHERE transcript IS NOT NULL AND transcript != ''
            ORDER BY display_order
        """)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def fetch_practice_exercises(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, part, slug, title, transcript
            FROM practice_listening_exercises
            WHERE transcript IS NOT NULL AND transcript != ''
            ORDER BY part, slug
        """)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def is_dialogue(transcript: str) -> bool:
    return bool(re.search(r"^[A-Z][a-z]+:", transcript, re.MULTILINE))


def split_dialogue(transcript: str) -> list[tuple[str, str]]:
    parts = []
    for line in transcript.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        match = re.match(r"^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s*(.+)$", line)
        if match:
            parts.append((match.group(1), match.group(2)))
        elif parts:
            speaker, text = parts[-1]
            parts[-1] = (speaker, text + " " + line)
    return parts


async def tts_with_timestamps(text: str, output_path: Path, voice: str, rate: str = "-10%"):
    """Generate audio and collect word boundary events."""
    communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    timestamps = []

    with open(output_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                timestamps.append({
                    "word": chunk["text"],
                    "offset": chunk["offset"] / 10_000_000,  # 100ns ticks → seconds
                    "duration": chunk["duration"] / 10_000_000,
                })

    return timestamps


async def generate_narration(text: str, output_path: Path, voice: str = VOICE_NARRATOR):
    """Single-voice audio with timestamps."""
    return await tts_with_timestamps(text, output_path, voice)


async def generate_dialogue(transcript: str, output_path: Path):
    """Multi-voice dialogue: generate segments, concatenate, merge timestamps."""
    parts = split_dialogue(transcript)
    if not parts:
        return await generate_narration(transcript, output_path)

    speakers = {}
    voices = [VOICE_FEMALE, VOICE_MALE]
    vi = 0
    for speaker, _ in parts:
        if speaker not in speakers:
            speakers[speaker] = voices[vi % len(voices)]
            vi += 1

    tmp_dir = output_path.parent / "_tmp"
    tmp_dir.mkdir(exist_ok=True)

    all_timestamps = []
    audio_chunks = []
    cumulative_offset = 0.0

    for i, (speaker, text) in enumerate(parts):
        seg_path = tmp_dir / f"{output_path.stem}_{i:03d}.mp3"
        seg_ts = await tts_with_timestamps(text, seg_path, speakers[speaker], rate="-5%")

        audio_chunks.append(seg_path.read_bytes())

        for ts in seg_ts:
            all_timestamps.append({
                "word": ts["word"],
                "offset": round(ts["offset"] + cumulative_offset, 3),
                "duration": round(ts["duration"], 3),
            })

        # Estimate segment duration from last timestamp
        if seg_ts:
            last = seg_ts[-1]
            cumulative_offset += last["offset"] + last["duration"] + 0.3  # gap between speakers

        seg_path.unlink()

    with open(output_path, "wb") as out:
        for chunk in audio_chunks:
            out.write(chunk)

    try:
        tmp_dir.rmdir()
    except OSError:
        pass

    return all_timestamps


async def gen_audio(transcript: str, output_path: Path):
    """Generate audio + timestamps, auto-detecting dialogue vs narration."""
    if is_dialogue(transcript):
        return await generate_dialogue(transcript, output_path)
    return await generate_narration(transcript, output_path)


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db_conn()

    # ── Exam sections (audio_url only, no word_timestamps column) ──
    sections = fetch_sections(conn)
    print(f"Exam sections: {len(sections)}")

    for s in sections:
        filename = f"exam_p{s['part']}_{s['display_order']:02d}_{s['id'][:8]}.mp3"
        output_path = OUTPUT_DIR / filename
        url = URL_PREFIX + "/" + filename

        if output_path.exists() and not FORCE:
            print(f"  [skip] {filename}")
        else:
            print(f"  [gen]  {filename}")
            await gen_audio(s["transcript"], output_path)

        with conn.cursor() as cur:
            cur.execute(
                "UPDATE exam_version_listening_sections SET audio_url = %s WHERE id = %s",
                (url, s["id"]),
            )
        conn.commit()

    # ── Practice exercises (audio_url + word_timestamps) ──
    exercises = fetch_practice_exercises(conn)
    print(f"Practice exercises: {len(exercises)}")

    for ex in exercises:
        filename = f"practice_{ex['slug']}_{ex['id'][:8]}.mp3"
        output_path = OUTPUT_DIR / filename
        url = URL_PREFIX + "/" + filename

        if output_path.exists() and not FORCE:
            print(f"  [skip] {filename}")
            timestamps = None  # keep existing
        else:
            print(f"  [gen]  {filename}")
            timestamps = await gen_audio(ex["transcript"], output_path)

        with conn.cursor() as cur:
            if timestamps is not None:
                cur.execute(
                    "UPDATE practice_listening_exercises SET audio_url = %s, word_timestamps = %s WHERE id = %s",
                    (url, json.dumps(timestamps), ex["id"]),
                )
            else:
                cur.execute(
                    "UPDATE practice_listening_exercises SET audio_url = %s WHERE id = %s",
                    (url, ex["id"]),
                )
        conn.commit()

    conn.close()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
