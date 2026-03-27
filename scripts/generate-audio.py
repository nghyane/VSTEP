# /// script
# requires-python = ">=3.11"
# dependencies = ["edge-tts", "boto3", "psycopg2-binary"]
# ///
"""
Generate TTS audio for vocabulary words & sentence items, upload to R2.

Usage:
    uv run scripts/generate-audio.py                    # all
    uv run scripts/generate-audio.py --type vocab       # vocabulary only
    uv run scripts/generate-audio.py --type sentences   # sentences only
    uv run scripts/generate-audio.py --dry-run          # preview without upload
    uv run scripts/generate-audio.py --concurrency 20   # parallel workers

Requires .env in apps/backend-v2/ with:
    DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
    AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, AWS_ENDPOINT
"""

import argparse
import asyncio
import os
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import boto3
import edge_tts
import psycopg2
from psycopg2.extras import RealDictCursor

VOICE = "en-US-AriaNeural"
R2_PREFIX_VOCAB = "audio/vocabulary"
R2_PREFIX_SENTENCES = "audio/sentences"

def load_env():
    """Load .env from backend-v2 directory."""
    env_path = Path(__file__).parent.parent / "apps" / "backend-v2" / ".env"
    if not env_path.exists():
        sys.exit(f".env not found at {env_path}")
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def get_db(env):
    return psycopg2.connect(
        host=env["DB_HOST"],
        port=int(env["DB_PORT"]),
        dbname=env["DB_DATABASE"],
        user=env["DB_USERNAME"],
        password=env["DB_PASSWORD"],
    )


def get_s3(env):
    return boto3.client(
        "s3",
        endpoint_url=env["AWS_ENDPOINT"],
        aws_access_key_id=env["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=env["AWS_SECRET_ACCESS_KEY"],
        region_name=env.get("AWS_DEFAULT_REGION", "auto"),
    )


def fetch_vocab_without_audio(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, word FROM vocabulary_words WHERE audio_url IS NULL ORDER BY sort_order"
        )
        return cur.fetchall()


def fetch_sentences_without_audio(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, sentence FROM sentence_items WHERE audio_url IS NULL ORDER BY sort_order"
        )
        return cur.fetchall()


def generate_audio_sync(text: str, output_path: str):
    """Run edge-tts in a new event loop (for thread pool)."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(_generate(text, output_path))
    finally:
        loop.close()


async def _generate(text: str, output_path: str):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)


def upload_to_r2(s3, bucket: str, local_path: str, r2_key: str):
    s3.upload_file(local_path, bucket, r2_key, ExtraArgs={"ContentType": "audio/mpeg"})


def update_audio_url(conn, table: str, record_id: str, audio_url: str):
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE {table} SET audio_url = %s, updated_at = NOW() WHERE id = %s",
            (audio_url, record_id),
        )
    conn.commit()


def process_item(s3, bucket, conn, table, record_id, text, r2_prefix, dry_run):
    """Generate audio, upload, update DB for a single item."""
    safe_name = record_id
    r2_key = f"{r2_prefix}/{safe_name}.mp3"

    if dry_run:
        print(f"  [dry-run] {text[:60]}... → {r2_key}")
        return True

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        generate_audio_sync(text, tmp_path)

        file_size = os.path.getsize(tmp_path)
        if file_size < 1000:
            print(f"  [skip] {text[:40]}... — audio too small ({file_size}B)")
            return False

        upload_to_r2(s3, bucket, tmp_path, r2_key)
        update_audio_url(conn, table, record_id, r2_key)
        print(f"  ✓ {text[:50]}...")
        return True
    except Exception as e:
        print(f"  ✗ {text[:40]}... — {e}")
        return False
    finally:
        os.unlink(tmp_path)


def run(args):
    env = load_env()
    conn = get_db(env)
    s3 = get_s3(env)
    bucket = env["AWS_BUCKET"]

    if args.type in ("all", "vocab"):
        rows = fetch_vocab_without_audio(conn)
        print(f"\nVocabulary: {len(rows)} words need audio")
        success = 0
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            futures = {
                pool.submit(
                    process_item,
                    s3, bucket, get_db(env), "vocabulary_words",
                    row["id"], row["word"], R2_PREFIX_VOCAB, args.dry_run,
                ): row
                for row in rows
            }
            for future in as_completed(futures):
                if future.result():
                    success += 1
        print(f"Vocabulary done: {success}/{len(rows)}")

    if args.type in ("all", "sentences"):
        rows = fetch_sentences_without_audio(conn)
        print(f"\nSentences: {len(rows)} items need audio")
        success = 0
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            futures = {
                pool.submit(
                    process_item,
                    s3, bucket, get_db(env), "sentence_items",
                    row["id"], row["sentence"], R2_PREFIX_SENTENCES, args.dry_run,
                ): row
                for row in rows
            }
            for future in as_completed(futures):
                if future.result():
                    success += 1
        print(f"Sentences done: {success}/{len(rows)}")

    conn.close()
    print("\nAll done.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate TTS audio & upload to R2")
    parser.add_argument("--type", choices=["all", "vocab", "sentences"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating/uploading")
    parser.add_argument("--concurrency", type=int, default=10, help="Parallel workers (default: 10)")
    run(parser.parse_args())
