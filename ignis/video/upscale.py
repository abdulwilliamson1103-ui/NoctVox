"""
upscale.py — Step 2 of Ignis Video Pipeline

Sends clips to Replicate (cloud GPU) for AI upscaling via Real-ESRGAN.
iPhone calls the API — a GPU cluster does the work — 4K file comes back.

Requires: REPLICATE_API_TOKEN in environment or .env file
Skip this step with --skip-upscale in run.py for faster testing.
"""

import os
import sys
import json
import argparse
import urllib.request


REPLICATE_MODEL = "cjwbw/real-esrgan:d0ee3d708c1b57ce1162429058f27c2d674cbb4dbf734b7ab49fa7da9d79f044"


def check_token():
    token = os.environ.get('REPLICATE_API_TOKEN')
    if not token:
        # Try loading from .env
        env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.local')
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith('REPLICATE_API_TOKEN='):
                        os.environ['REPLICATE_API_TOKEN'] = line.split('=', 1)[1].strip()
                        return
        print("REPLICATE_API_TOKEN not set.")
        print("Add it to .env.local: REPLICATE_API_TOKEN=your_token")
        print("Get a token at: replicate.com/account/api-tokens")
        sys.exit(1)


def upscale_clip(clip_path, output_dir, scale=4):
    """
    Run Real-ESRGAN on one clip via Replicate.
    Returns path to the upscaled file.
    """
    try:
        import replicate
    except ImportError:
        print("replicate not installed. Run: pip install replicate")
        sys.exit(1)

    filename = os.path.basename(clip_path)
    output_path = os.path.join(output_dir, f"up_{filename}")

    if os.path.exists(output_path):
        print(f"  Already upscaled — skipping: {filename}")
        return output_path

    print(f"  Upscaling: {filename}")
    with open(clip_path, 'rb') as f:
        output_url = replicate.run(
            REPLICATE_MODEL,
            input={
                'video':        f,
                'scale':        scale,
                'face_enhance': False,
            }
        )

    # output_url is a string URL to the processed file
    print(f"  Downloading result...")
    urllib.request.urlretrieve(str(output_url), output_path)
    print(f"  Saved: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description='Upscale — Step 2')
    parser.add_argument('--input',  required=True, help='timestamps.json or clips folder')
    parser.add_argument('--output', default='upscaled', help='Output folder for upscaled clips')
    parser.add_argument('--scale',  type=int, default=4, choices=[2, 4], help='Upscale factor')
    args = parser.parse_args()

    check_token()
    os.makedirs(args.output, exist_ok=True)

    # Load clip list
    if args.input.endswith('.json'):
        with open(args.input) as f:
            data = json.load(f)
        clips = data['clips']
    else:
        SUPPORTED = ('.mp4', '.mov', '.MP4', '.MOV', '.m4v', '.M4V')
        clips = sorted([
            os.path.join(args.input, f)
            for f in os.listdir(args.input)
            if f.endswith(SUPPORTED)
        ])

    print(f"Upscaling {len(clips)} clips via Replicate (scale: {args.scale}x)...")
    upscaled = []
    for i, clip in enumerate(clips):
        print(f"\n[{i+1}/{len(clips)}]")
        path = upscale_clip(clip, args.output, args.scale)
        upscaled.append(path)

    # Write upscaled paths back into timestamps.json
    if args.input.endswith('.json'):
        with open(args.input) as f:
            data = json.load(f)
        data['upscaled_clips'] = upscaled
        with open(args.input, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\nUpdated {args.input} with upscaled paths")

    print(f"\nDone. {len(upscaled)} clips upscaled to {args.output}/")
    print("Next: python stitch.py --data timestamps.json --type anime")


if __name__ == '__main__':
    main()
