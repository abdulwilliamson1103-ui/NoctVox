"""
stitch.py — Step 3 of Ignis Video Pipeline

Stitches upscaled clips into a final cinematic edit using FFmpeg.
- Cuts clips at beat-synced timestamps
- Applies a LUT (colour grade) if provided
- Mixes in SFX at cut points if --sfx-dir is provided
- Exports H.265 (HEVC) for maximum quality at minimum file size

Requires: ffmpeg in PATH
Usage:
  python stitch.py --data timestamps.json --type anime
  python stitch.py --data timestamps.json --type cinematic --lut luts/KodakVision.cube
"""

import os
import sys
import json
import argparse
import subprocess
import tempfile
import shutil


STYLE_PRESETS = {
    'anime':      {'contrast': 1.08, 'saturation': 1.20, 'brightness': 0.02},
    'cinematic':  {'contrast': 1.12, 'saturation': 0.85, 'brightness': -0.02},
    'gaming':     {'contrast': 1.18, 'saturation': 1.30, 'brightness': 0.01},
    'portrait':   {'contrast': 1.05, 'saturation': 1.10, 'brightness': 0.04},
    'sport':      {'contrast': 1.15, 'saturation': 1.25, 'brightness': 0.01},
    'product':    {'contrast': 1.03, 'saturation': 1.05, 'brightness': 0.03},
    'zenith':     {'contrast': 1.16, 'saturation': 1.22, 'brightness': 0.00},
    'raw':        {'contrast': 1.00, 'saturation': 1.00, 'brightness': 0.00},
}


def check_ffmpeg():
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("ffmpeg not found. Install it:")
        print("  macOS:   brew install ffmpeg")
        print("  Ubuntu:  apt install ffmpeg")
        print("  Windows: https://ffmpeg.org/download.html")
        sys.exit(1)


def build_color_filter(style_name, lut_path=None):
    """
    Returns an ffmpeg vf filter string for colour grading.
    LUT takes priority over style preset curves if both are given.
    """
    preset = STYLE_PRESETS.get(style_name, STYLE_PRESETS['cinematic'])
    c = preset['contrast']
    s = preset['saturation']
    b = preset['brightness']

    # eq filter for basic adjustments
    eq = f"eq=contrast={c}:saturation={s}:brightness={b}"

    if lut_path and os.path.exists(lut_path):
        ext = os.path.splitext(lut_path)[1].lower()
        if ext == '.cube':
            # Escape path for FFmpeg filter string — forward slashes, escape single quotes
            safe = os.path.abspath(lut_path).replace('\\', '/').replace("'", "\\'")
            return f"{eq},lut3d='{safe}'"
        else:
            print(f"  Warning: unsupported LUT format {ext} — skipping LUT")

    return eq


def trim_clip(clip_path, duration, output_path):
    """
    Trim a single clip to `duration` seconds.
    Returns output_path, or None if FFmpeg fails.
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', clip_path,
        '-t', str(duration),
        '-c', 'copy',
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True)
    if result.returncode != 0:
        return None
    return output_path


def mix_sfx_at_cuts(clip_paths, sfx_dir, output_dir, content_type='cinematic'):
    """
    Overlay SFX at the start of each clip.
    - Prefers type-specific subfolder: sfx/cinematic/ over sfx/
    - Cycles through the full palette so each cut gets a different sound
    - Handles clips with no audio track (AI-gen clips often have none)
    Falls back silently if no SFX files found.
    """
    if not sfx_dir or not os.path.isdir(sfx_dir):
        return clip_paths

    # Prefer type-specific subfolder if it exists and has sounds
    type_dir = os.path.join(sfx_dir, content_type)
    search_dir = type_dir if os.path.isdir(type_dir) else sfx_dir

    sfx_candidates = sorted([
        os.path.join(search_dir, f)
        for f in os.listdir(search_dir)
        if f.endswith(('.wav', '.mp3', '.aac', '.m4a'))
    ])
    if not sfx_candidates:
        return clip_paths

    print(f"  SFX palette ({content_type}): {len(sfx_candidates)} sound(s)")

    mixed = []
    for i, clip in enumerate(clip_paths):
        sfx_file = sfx_candidates[i % len(sfx_candidates)]  # cycle — no repeated sounds
        out = os.path.join(output_dir, f"sfx_{i:04d}_{os.path.basename(clip)}")

        # Primary: mix SFX with existing clip audio
        cmd = [
            'ffmpeg', '-y',
            '-i', clip,
            '-i', sfx_file,
            '-filter_complex',
            '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0.3[aout]',
            '-map', '0:v',
            '-map', '[aout]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            out,
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode == 0:
            mixed.append(out)
            continue

        # Fallback: clip has no audio track (common with AI-gen clips) — use SFX as sole audio
        cmd_noaudio = [
            'ffmpeg', '-y',
            '-i', clip,
            '-i', sfx_file,
            '-filter_complex', '[1:a]apad=pad_dur=10[aout]',
            '-map', '0:v',
            '-map', '[aout]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            out,
        ]
        result2 = subprocess.run(cmd_noaudio, capture_output=True)
        mixed.append(out if result2.returncode == 0 else clip)

    return mixed


def stitch_clips(clip_paths, color_filter, output_path, song_path=None):
    """
    Concatenate clips with FFmpeg concat demuxer, apply colour grade, export H.265.
    """
    # Write concat list file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for clip in clip_paths:
            # FFmpeg concat format requires escaping single quotes in paths
            safe = os.path.abspath(clip).replace("'", "\\'")
            f.write(f"file '{safe}'\n")
        concat_file = f.name

    # Build filter chain
    vf = color_filter

    # Base ffmpeg command — concat demuxer
    cmd = [
        'ffmpeg', '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concat_file,
    ]

    # Add song as second audio input if provided
    if song_path and os.path.exists(song_path):
        cmd += ['-i', song_path]
        cmd += [
            # Apply video grade via filter_complex, map song audio directly
            '-filter_complex', f"[0:v]{vf}[vout]",
            '-map', '[vout]',
            '-map', '1:a',      # song audio — no intermediate filter needed
            '-shortest',        # trim to shorter of video vs song
        ]
    else:
        cmd += [
            '-vf', vf,
            '-map', '0:v',
            '-map', '0:a?',     # include clip audio if present, skip if not
        ]

    # H.265 export — high quality, small file size
    cmd += [
        '-c:v', 'libx265',
        '-crf', '22',
        '-preset', 'slow',
        '-tag:v', 'hvc1',   # Apple compatibility
        '-movflags', '+faststart',
        '-c:a', 'aac',
        '-b:a', '192k',
        output_path,
    ]

    print(f"  Running FFmpeg export...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(concat_file)

    if result.returncode != 0:
        print(f"  FFmpeg error:\n{result.stderr[-2000:]}")
        sys.exit(1)

    return output_path


def main():
    parser = argparse.ArgumentParser(description='Stitch — Step 3')
    parser.add_argument('--data',    required=True, help='timestamps.json from beat_sync.py')
    parser.add_argument('--type',    default='cinematic',
                        choices=list(STYLE_PRESETS.keys()),
                        help='Colour grade style: anime|cinematic|gaming|portrait|sport|product|zenith|raw')
    parser.add_argument('--lut',     default=None, help='Path to .cube LUT file (overrides style)')
    parser.add_argument('--sfx-dir', default=None, help='Folder of SFX .wav files for cut transitions')
    parser.add_argument('--output',  default='final_output.mp4', help='Output file path')
    parser.add_argument('--clip-duration', type=float, default=2.5,
                        help='Seconds per clip (used to trim before stitching)')
    args = parser.parse_args()

    check_ffmpeg()

    with open(args.data) as f:
        data = json.load(f)

    # Use upscaled clips if available, fall back to originals
    clips = data.get('upscaled_clips') or data.get('clips', [])
    song  = data.get('song')

    if not clips:
        print("No clips found in timestamps.json")
        sys.exit(1)

    print(f"Stitching {len(clips)} clips — style: {args.type}")

    tmpdir = tempfile.mkdtemp(prefix='ignis_stitch_')
    try:
        # Step 1 — Trim each clip to the per-slot duration
        print("\nTrimming clips...")
        trimmed = []
        for i, clip in enumerate(clips):
            if not os.path.exists(clip):
                print(f"  Missing: {clip} — skipping")
                continue
            out = os.path.join(tmpdir, f"trim_{i:04d}.mp4")
            result = trim_clip(clip, args.clip_duration, out)
            if result is None:
                print(f"  [{i+1}/{len(clips)}] FAILED (bad codec?) — skipping: {os.path.basename(clip)}")
            else:
                trimmed.append(out)
                print(f"  [{i+1}/{len(clips)}] {os.path.basename(clip)}")

        if not trimmed:
            print("No valid clips to stitch.")
            sys.exit(1)

        # Step 2 — Overlay SFX at cut points
        if args.sfx_dir:
            print("\nMixing SFX...")
            trimmed = mix_sfx_at_cuts(trimmed, args.sfx_dir, tmpdir, content_type=args.type)

        # Step 3 — Build colour filter
        color_filter = build_color_filter(args.type, args.lut)
        print(f"\nColour grade: {color_filter[:60]}{'...' if len(color_filter)>60 else ''}")

        # Step 4 — Stitch + grade + export
        print(f"\nExporting: {args.output}")
        stitch_clips(trimmed, color_filter, args.output, song_path=song)

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    size_mb = os.path.getsize(args.output) / (1024 * 1024)
    print(f"\nDone. Output: {args.output} ({size_mb:.1f}MB)")
    print("H.265 / HEVC — Apple compatible")


if __name__ == '__main__':
    main()
