#!/usr/bin/env python3
"""
Generate MP3 audio from listening transcripts using edge-tts.

Reads sections from DB, generates audio, saves to storage/app/public/audio/listening/,
updates audio_url in DB.

Usage: python3 scripts/gen_listening_audio.py
Requires: pip install edge-tts psycopg2-binary python-dotenv
"""

import asyncio
import os
import re
import sys
from pathlib import Path

import edge_tts

# Load .env
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

import psycopg2

# ── Config ──
VOICE_NARRATOR = "en-US-GuyNeural"       # Male narrator (announcements, lectures)
VOICE_FEMALE = "en-US-JennyNeural"        # Female speaker in dialogues
VOICE_MALE = "en-US-GuyNeural"            # Male speaker in dialogues

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "storage/app/public/audio/listening"
# URL prefix served by Laravel (storage:link)
URL_PREFIX = "/storage/audio/listening"


def get_db_conn():
    """Connect using Laravel .env vars."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_DATABASE", "vstep"),
        user=os.getenv("DB_USERNAME", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def fetch_sections(conn):
    """Fetch sections that have transcript but no audio_url."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, part, display_order, part_title, transcript
            FROM exam_version_listening_sections
            WHERE transcript IS NOT NULL AND transcript != ''
              AND (audio_url IS NULL OR audio_url = '')
            ORDER BY display_order
        """)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def fetch_practice_exercises(conn):
    """Fetch practice exercises that have transcript but no audio_url."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, part, slug, title, transcript
            FROM practice_listening_exercises
            WHERE transcript IS NOT NULL AND transcript != ''
              AND (audio_url IS NULL OR audio_url = '')
        """)
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def is_dialogue(transcript: str) -> bool:
    """Check if transcript has speaker labels (e.g. 'Student:', 'Receptionist:')."""
    return bool(re.search(r'^[A-Z][a-z]+:', transcript, re.MULTILINE))


def split_dialogue(transcript: str) -> list[tuple[str, str]]:
    """Split dialogue into [(speaker, text), ...] pairs."""
    parts = []
    for line in transcript.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        match = re.match(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s*(.+)$', line)
        if match:
            parts.append((match.group(1), match.group(2)))
        elif parts:
            # Continuation of previous speaker
            speaker, text = parts[-1]
            parts[-1] = (speaker, text + ' ' + line)
    return parts


async def generate_narration(text: str, output_path: Path, voice: str = VOICE_NARRATOR):
    """Generate single-voice audio."""
    communicate = edge_tts.Communicate(text, voice, rate="-10%")
    await communicate.save(str(output_path))


async def generate_dialogue(transcript: str, output_path: Path):
    """Generate multi-voice dialogue by concatenating speaker segments."""
    parts = split_dialogue(transcript)
    if not parts:
        await generate_narration(transcript, output_path)
        return

    # Assign voices to speakers (alternate male/female)
    speakers = {}
    voices = [VOICE_FEMALE, VOICE_MALE]
    voice_idx = 0
    for speaker, _ in parts:
        if speaker not in speakers:
            speakers[speaker] = voices[voice_idx % len(voices)]
            voice_idx += 1

    # Generate each segment, then concatenate
    tmp_dir = output_path.parent / "_tmp"
    tmp_dir.mkdir(exist_ok=True)
    segment_files = []

    for i, (speaker, text) in enumerate(parts):
        seg_path = tmp_dir / f"{output_path.stem}_{i:03d}.mp3"
        communicate = edge_tts.Communicate(text, speakers[speaker], rate="-5%")
        await communicate.save(str(seg_path))
        segment_files.append(seg_path)

    # Concatenate MP3 files (simple binary concat works for MP3)
    with open(output_path, 'wb') as out:
        for seg in segment_files:
            out.write(seg.read_bytes())

    # Cleanup
    for seg in segment_files:
        seg.unlink()
    try:
        tmp_dir.rmdir()
    except OSError:
        pass


async def process_section(section: dict, prefix: str = "exam"):
    """Generate audio for one section."""
    section_id = section['id']
    transcript = section['transcript']
    order = section.get('display_order', 0)
    part = section['part']

    filename = f"{prefix}_p{part}_{order:02d}_{section_id[:8]}.mp3"
    output_path = OUTPUT_DIR / filename

    if output_path.exists():
        print(f"  [skip] {filename} already exists")
        return URL_PREFIX + "/" + filename

    print(f"  [gen]  {filename} ({len(transcript)} chars)")

    if is_dialogue(transcript):
        await generate_dialogue(transcript, output_path)
    else:
        await generate_narration(transcript, output_path)

    return URL_PREFIX + "/" + filename


async def process_practice(exercise: dict):
    """Generate audio for one practice exercise."""
    ex_id = exercise['id']
    transcript = exercise['transcript']
    slug = exercise['slug']

    filename = f"practice_{slug}_{ex_id[:8]}.mp3"
    output_path = OUTPUT_DIR / filename

    if output_path.exists():
        print(f"  [skip] {filename} already exists")
        return URL_PREFIX + "/" + filename

    print(f"  [gen]  {filename} ({len(transcript)} chars)")

    if is_dialogue(transcript):
        await generate_dialogue(transcript, output_path)
    else:
        await generate_narration(transcript, output_path)

    return URL_PREFIX + "/" + filename


async def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    conn = get_db_conn()

    # ── Exam sections ──
    sections = fetch_sections(conn)
    print(f"Exam sections to process: {len(sections)}")

    for section in sections:
        url = await process_section(section)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE exam_version_listening_sections SET audio_url = %s WHERE id = %s",
                (url, section['id']),
            )
        conn.commit()

    # ── Practice exercises ──
    exercises = fetch_practice_exercises(conn)
    print(f"Practice exercises to process: {len(exercises)}")

    for ex in exercises:
        url = await process_practice(ex)
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE practice_listening_exercises SET audio_url = %s WHERE id = %s",
                (url, ex['id']),
            )
        conn.commit()

    conn.close()
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
