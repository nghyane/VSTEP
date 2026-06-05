#!/usr/bin/env python3
"""Generate VSTEP reference listening audio with edge-tts.

The Laravel command uploads the produced MP3 to the same R2/admin namespace
used by manual admin uploads. This script only synthesizes one section.
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
import tempfile
from pathlib import Path

try:
    import edge_tts
except ImportError:  # pragma: no cover - exercised by the Artisan command output
    print(
        "Missing Python package: edge-tts. Install with `python3 -m pip install -r scripts/tts/requirements.txt`.",
        file=sys.stderr,
    )
    raise SystemExit(2)


SPEAKER_RE = re.compile(r"^([A-Z][A-Za-z0-9\s.'-]{0,40}):\s*(.+)$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate one VSTEP exam listening MP3 section")
    parser.add_argument("--text-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--part", required=True, type=int, choices=[1, 2, 3])
    parser.add_argument("--voice-part1", default="en-US-JennyNeural")
    parser.add_argument("--voice-part2", default="en-US-JennyNeural,en-US-GuyNeural,en-GB-SoniaNeural,en-GB-RyanNeural")
    parser.add_argument("--voice-part3", default="en-US-AriaNeural")
    parser.add_argument("--rate", default="+0%")
    return parser.parse_args()


def dialogue_turns(transcript: str) -> list[tuple[str, str]]:
    turns: list[tuple[str, str]] = []
    last_speaker = ""

    for raw_line in transcript.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        match = SPEAKER_RE.match(line)
        if match:
            last_speaker = match.group(1).strip()
            turns.append((last_speaker, match.group(2).strip()))
        elif turns and last_speaker:
            speaker, text = turns[-1]
            turns[-1] = (speaker, f"{text} {line}")
        else:
            turns.append(("", line))

    return [(speaker, text) for speaker, text in turns if text]


async def synthesize(text: str, output: Path, voice: str, rate: str) -> None:
    await edge_tts.Communicate(text, voice, rate=rate).save(str(output))


async def synthesize_single(transcript: str, output: Path, voice: str, rate: str) -> None:
    await synthesize(transcript, output, voice, rate)


async def synthesize_dialogue(transcript: str, output: Path, voices: list[str], rate: str) -> None:
    turns = dialogue_turns(transcript)
    if len(turns) <= 1:
        await synthesize_single(transcript, output, voices[0], rate)
        return

    speaker_voices: dict[str, str] = {}
    chunks: list[Path] = []

    with tempfile.TemporaryDirectory() as temp_dir:
        temp = Path(temp_dir)
        for index, (speaker, text) in enumerate(turns):
            if speaker not in speaker_voices:
                speaker_voices[speaker] = voices[len(speaker_voices) % len(voices)]

            chunk = temp / f"turn-{index:03d}.mp3"
            await synthesize(text, chunk, speaker_voices[speaker], rate)
            chunks.append(chunk)

        with output.open("wb") as target:
            for chunk in chunks:
                target.write(chunk.read_bytes())


async def main() -> int:
    args = parse_args()
    transcript = Path(args.text_file).read_text(encoding="utf-8").strip()
    if not transcript:
        print("Transcript is empty.", file=sys.stderr)
        return 1

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    if args.part == 1:
        await synthesize_single(transcript, output, args.voice_part1, args.rate)
    elif args.part == 2:
        voices = [voice.strip() for voice in args.voice_part2.split(",") if voice.strip()]
        if not voices:
            print("At least one Part 2 voice is required.", file=sys.stderr)
            return 1
        await synthesize_dialogue(transcript, output, voices, args.rate)
    else:
        await synthesize_single(transcript, output, args.voice_part3, args.rate)

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
