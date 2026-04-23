"""
beat_sync.py — Step 1 of Ignis Video Pipeline

Reads a song and returns exact cut timestamps aligned to beat drops.
If no song provided, generates evenly spaced timing from clip count.

Output: timestamps.json (consumed by upscale.py and stitch.py)
"""

import os
import sys
import json
import argparse
import numpy as np


SUPPORTED = ('.mp4', '.mov', '.MP4', '.MOV', '.m4v', '.M4V')


def load_clips(folder):
    clips = sorted([
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.endswith(SUPPORTED)
    ])
    if not clips:
        print(f"No video clips found in: {folder}")
        sys.exit(1)
    return clips


def detect_onsets(song_path, min_gap_sec=0.25):
    """
    Find the actual beat drops — not just grid beats.
    min_gap_sec prevents two cuts from being too close together.
    """
    try:
        import librosa
    except ImportError:
        print("librosa not installed. Run: pip install librosa soundfile")
        sys.exit(1)

    print(f"Loading song: {song_path}")
    y, sr = librosa.load(song_path, sr=None)

    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr,
        wait=int(min_gap_sec * sr / 512),
        pre_avg=3, post_avg=3,
        pre_max=3, post_max=3,
        delta=0.07,
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr).tolist()

    # Also get BPM for reference
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    print(f"BPM: {float(tempo):.1f} | Onsets detected: {len(onset_times)}")
    return onset_times


def generate_timing(clip_count, avg_duration=2.5):
    """
    No song provided — space cuts evenly.
    avg_duration: seconds per clip slot.
    """
    return [i * avg_duration for i in range(clip_count)]


def select_timestamps(onsets, clip_count):
    """
    Pick the best onset timestamps for the number of clips.
    Spreads selection across the full song rather than bunching at the start.
    """
    if len(onsets) <= clip_count:
        return onsets

    # Sample evenly across onset list
    indices = np.linspace(0, len(onsets) - 1, clip_count, dtype=int)
    return [onsets[i] for i in indices]


def main():
    parser = argparse.ArgumentParser(description='Beat sync — Step 1')
    parser.add_argument('--clips',  required=True, help='Folder containing video clips')
    parser.add_argument('--song',   default=None,  help='Song file path (optional)')
    parser.add_argument('--output', default='timestamps.json', help='Output JSON path')
    parser.add_argument('--gap',    type=float, default=0.25, help='Min seconds between cuts')
    args = parser.parse_args()

    clips = load_clips(args.clips)
    print(f"Clips found: {len(clips)}")
    for c in clips:
        print(f"  {os.path.basename(c)}")

    if args.song:
        all_onsets = detect_onsets(args.song, min_gap_sec=args.gap)
        timestamps = select_timestamps(all_onsets, len(clips))
        print(f"Selected {len(timestamps)} timestamps for {len(clips)} clips")
    else:
        print("No song — generating evenly spaced timing")
        timestamps = generate_timing(len(clips))

    result = {
        'clips':       clips,
        'timestamps':  timestamps,
        'song':        args.song,
        'clip_count':  len(clips),
    }

    with open(args.output, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nTimestamps written to: {args.output}")
    print("Next: python upscale.py --input timestamps.json")
    print("  or: python stitch.py --data timestamps.json  (skip upscale)")


if __name__ == '__main__':
    main()
