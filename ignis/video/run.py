"""
run.py — Ignis Video Pipeline Master Runner

Chains all three steps in order:
  Step 1: beat_sync.py  — detect beat timestamps from song
  Step 2: upscale.py    — AI upscale clips via Replicate (skip with --skip-upscale)
  Step 3: stitch.py     — FFmpeg concat + LUT + SFX + H.265 export

Usage (full pipeline):
  python run.py --clips ./my_clips --song track.mp3 --type anime

Usage (skip upscale for fast testing):
  python run.py --clips ./my_clips --type cinematic --skip-upscale

Usage (existing timestamps, skip beat sync too):
  python run.py --data timestamps.json --type portrait --skip-upscale
"""

import os
import sys
import json
import argparse
import subprocess


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def run_step(label, script, args_list):
    cmd = [sys.executable, os.path.join(SCRIPT_DIR, script)] + args_list
    print(f"\n{'='*56}")
    print(f"  {label}")
    print(f"{'='*56}")
    print(f"  $ {' '.join(cmd)}\n")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"\n[run.py] {label} failed — stopping pipeline.")
        sys.exit(result.returncode)


def main():
    parser = argparse.ArgumentParser(
        description='Ignis Video Pipeline — full orchestrator',
        formatter_class=argparse.RawTextHelpFormatter,
    )

    # Input sources
    parser.add_argument('--clips',  default=None, help='Folder of raw video clips')
    parser.add_argument('--song',   default=None, help='Song file for beat sync (optional)')
    parser.add_argument('--data',   default='timestamps.json',
                        help='Existing timestamps.json (skips beat_sync if file exists)')

    # Style
    parser.add_argument('--type',   default='cinematic',
                        choices=['anime','cinematic','portrait','sport','raw'],
                        help='Colour grade style')
    parser.add_argument('--lut',    default=None, help='Path to .cube LUT file')
    parser.add_argument('--sfx-dir',default=None, help='SFX folder for cut transitions')

    # Pipeline control
    parser.add_argument('--skip-upscale',  action='store_true',
                        help='Skip AI upscale — use original clips (faster, for testing)')
    parser.add_argument('--upscale-output',default='upscaled',
                        help='Folder for upscaled clips')
    parser.add_argument('--scale',         type=int, default=4, choices=[2, 4],
                        help='Upscale factor (default 4x)')
    parser.add_argument('--clip-duration', type=float, default=2.5,
                        help='Seconds per clip slot (default 2.5)')
    parser.add_argument('--output',        default='final_output.mp4',
                        help='Final output file path')

    args = parser.parse_args()

    # ── Validate inputs ──────────────────────────────────
    data_exists = os.path.exists(args.data)

    if not data_exists and not args.clips:
        parser.error("Provide --clips (raw clip folder) or --data (existing timestamps.json)")

    print(f"\nIgnis Video Pipeline")
    print(f"  Style:    {args.type}")
    print(f"  Upscale:  {'skipped' if args.skip_upscale else f'{args.scale}x via Replicate'}")
    print(f"  Output:   {args.output}")

    # ── Step 1: Beat Sync ────────────────────────────────
    if data_exists:
        print(f"\n[Step 1] Skipping — using existing {args.data}")
    else:
        beat_args = ['--clips', args.clips, '--output', args.data]
        if args.song:
            beat_args += ['--song', args.song]
        run_step("Step 1 — Beat Sync", 'beat_sync.py', beat_args)

    # ── Step 2: AI Upscale ───────────────────────────────
    if args.skip_upscale:
        print(f"\n[Step 2] Skipping upscale — clips will be used as-is")
    else:
        upscale_args = [
            '--input', args.data,
            '--output', args.upscale_output,
            '--scale', str(args.scale),
        ]
        run_step("Step 2 — AI Upscale (Replicate)", 'upscale.py', upscale_args)

    # ── Step 3: Stitch ───────────────────────────────────
    stitch_args = [
        '--data',          args.data,
        '--type',          args.type,
        '--output',        args.output,
        '--clip-duration', str(args.clip_duration),
    ]
    if args.lut:
        stitch_args += ['--lut', args.lut]
    if args.sfx_dir:
        stitch_args += ['--sfx-dir', args.sfx_dir]

    run_step("Step 3 — Stitch + Grade + Export", 'stitch.py', stitch_args)

    # ── Done ─────────────────────────────────────────────
    size_mb = os.path.getsize(args.output) / (1024 * 1024) if os.path.exists(args.output) else 0
    print(f"\n{'='*56}")
    print(f"  Pipeline complete.")
    print(f"  Output: {args.output} ({size_mb:.1f}MB)")
    print(f"{'='*56}\n")


if __name__ == '__main__':
    main()
