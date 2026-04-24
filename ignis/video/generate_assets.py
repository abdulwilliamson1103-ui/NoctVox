"""
generate_assets.py — Phase 2 one-time setup for Ignis Video Pipeline

Run this once to generate:
  luts/anime.cube      — high saturation, warm, punchy
  luts/cinematic.cube  — orange-teal split grade, lifted blacks, film look
  luts/gaming.cube     — high contrast, vibrant, cool/teal bias
  luts/product.cube    — clean, neutral, slight warmth
  luts/zenith.cube     — gaming vibrance + cinematic weight overlay

  sfx/whoosh.wav, impact.wav, riser.wav     — root fallback (silent placeholders)
  sfx/anime/    whoosh, sword_ring, impact, energy_burst
  sfx/cinematic/ cloth_movement, footstep_marble, door_close, deep_riser
  sfx/gaming/   punch_impact, glass_shatter, bell_drop, power_up
  sfx/product/  soft_click, chime, whoosh_clean, soft_impact
  sfx/zenith/   cinematic_hit, bass_drop, energy_riser, sword_ring

All SFX are silent placeholders. Replace with real audio.
stitch.py auto-selects the sfx/{type}/ subfolder matching the content type,
cycles through all sounds in that folder, and handles clips with no audio track.

SFX sources:
  ElevenLabs: POST /v1/sound-generation  {"text": "leather shoe on marble floor"}
  Freesound:  freesound.org/apiv2  (500k+ CC licensed sounds)
  BBC:        bbcrewind.co.uk/sound-effects  (16k broadcast-grade, free)

Usage:
  python generate_assets.py
"""

import os
import math
import wave
import struct


# ── Colour math helpers ─────────────────────────────────

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def rgb_to_hsl(r, g, b):
    mx = max(r, g, b)
    mn = min(r, g, b)
    l  = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        h = (g - b) / d + (6 if g < b else 0)
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h / 6, s, l


def hsl_to_rgb(h, s, l):
    if s == 0:
        return l, l, l

    def hue2rgb(p, q, t):
        if t < 0: t += 1
        if t > 1: t -= 1
        if t < 1/6: return p + (q - p) * 6 * t
        if t < 1/2: return q
        if t < 2/3: return p + (q - p) * (2/3 - t) * 6
        return p

    q = l * (1 + s) if l < 0.5 else l + s - l * s
    p = 2 * l - q
    return hue2rgb(p, q, h + 1/3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1/3)


def adjust_sat(r, g, b, factor):
    h, s, l = rgb_to_hsl(r, g, b)
    s = clamp(s * factor)
    return hsl_to_rgb(h, s, l)


def scurve(v, strength=1.0):
    """S-curve contrast: lifts mids, keeps blacks and whites."""
    return clamp(v + strength * math.sin(math.pi * v) * 0.1)


def lift_blacks(v, amount):
    """Raise the black point — film/cinematic look."""
    return clamp(v * (1 - amount) + amount)


def luma(r, g, b):
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


# ── Grade functions — one per style ────────────────────

def grade_anime(r, g, b):
    # High saturation · warm midtones · punchy contrast
    r, g, b = adjust_sat(r, g, b, 1.30)
    r = clamp(r * 1.04 + 0.01)        # warm push
    b = clamp(b * 0.94)               # reduce cool tones
    return scurve(r, 0.85), scurve(g, 0.85), scurve(b, 0.75)


def grade_cinematic(r, g, b):
    # Lifted blacks · slightly desaturated · orange-teal split
    r = lift_blacks(r, 0.04)
    g = lift_blacks(g, 0.03)
    b = lift_blacks(b, 0.05)
    r, g, b = adjust_sat(r, g, b, 0.88)
    lu = luma(r, g, b)
    # Shadow teal / highlight orange split grade
    cool   = (1.0 - lu) * 0.04        # teal in shadows
    warm   = lu * lu   * 0.04         # orange in highlights
    r = clamp(r - cool * 0.6 + warm)
    g = clamp(g - cool * 0.3)
    b = clamp(b + cool - warm * 0.5)
    return r, g, b


def grade_gaming(r, g, b):
    # High contrast · vibrant · cool/teal bias
    r, g, b = adjust_sat(r, g, b, 1.40)
    r = scurve(r, 1.5)
    g = scurve(g, 1.4)
    b = scurve(b, 1.5)
    # Teal push
    r = clamp(r * 0.95)
    g = clamp(g * 1.01)
    b = clamp(b * 1.06)
    return r, g, b


def grade_product(r, g, b):
    # Clean · neutral · subtle warmth in midtones only
    r, g, b = adjust_sat(r, g, b, 1.05)
    r = scurve(r, 0.35)
    g = scurve(g, 0.30)
    b = scurve(b, 0.30)
    lu = luma(r, g, b)
    warmth = lu * (1 - lu) * 0.03     # warmth peaks at midtones
    r = clamp(r + warmth)
    b = clamp(b - warmth * 0.4)
    return r, g, b


def grade_zenith(r, g, b):
    # Gaming base + cinematic overlay — NPC moments need energy AND weight
    # Start with gaming vibrance and contrast
    r, g, b = adjust_sat(r, g, b, 1.32)
    r = scurve(r, 1.3)
    g = scurve(g, 1.2)
    b = scurve(b, 1.3)
    r = clamp(r * 0.96)               # slight teal push from gaming
    b = clamp(b * 1.04)
    # Overlay cinematic: lift blacks + shadow teal for weight
    r = lift_blacks(r, 0.025)
    g = lift_blacks(g, 0.018)
    b = lift_blacks(b, 0.030)
    lu = luma(r, g, b)
    cool = (1.0 - lu) * 0.025
    warm = lu * lu   * 0.025
    r = clamp(r - cool * 0.5 + warm)
    b = clamp(b + cool - warm * 0.4)
    return r, g, b


# ── LUT writer ──────────────────────────────────────────

def write_cube(path, title, grade_fn, size=17):
    """
    Write a valid .cube 3D LUT file.
    size=17 → 17^3 = 4913 entries. Enough for smooth grading.
    size=33 → 35937 entries (photographic accuracy, slower to generate).
    """
    step = 1.0 / (size - 1)
    with open(path, 'w') as f:
        f.write(f'TITLE "{title}"\n')
        f.write(f'LUT_3D_SIZE {size}\n\n')
        # Standard .cube order: R fastest, B slowest
        for b_i in range(size):
            for g_i in range(size):
                for r_i in range(size):
                    r  = r_i * step
                    g  = g_i * step
                    b  = b_i * step
                    ro, go, bo = grade_fn(r, g, b)
                    f.write(f'{clamp(ro):.6f} {clamp(go):.6f} {clamp(bo):.6f}\n')
    kb = os.path.getsize(path) / 1024
    print(f'  ✓  {os.path.basename(path)}  ({kb:.0f}KB)')


# ── SFX placeholder writer ──────────────────────────────

def write_silent_wav(path, duration_sec=0.5, sample_rate=44100):
    """
    Write a silent mono 16-bit WAV at 44.1kHz.
    Replace with real SFX for production use.
    """
    n = int(duration_sec * sample_rate)
    with wave.open(path, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)          # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(b'\x00\x00' * n)
    print(f'  ✓  {os.path.basename(path)}  [silent placeholder — replace with real SFX]')


# ── Main ────────────────────────────────────────────────

if __name__ == '__main__':
    root     = os.path.dirname(os.path.abspath(__file__))
    luts_dir = os.path.join(root, 'luts')
    sfx_dir  = os.path.join(root, 'sfx')
    os.makedirs(luts_dir, exist_ok=True)
    os.makedirs(sfx_dir,  exist_ok=True)

    print('\nGenerating LUTs (17x17x17 — 4913 entries each)...')
    write_cube(os.path.join(luts_dir, 'anime.cube'),     'Ignis Anime',     grade_anime)
    write_cube(os.path.join(luts_dir, 'cinematic.cube'), 'Ignis Cinematic', grade_cinematic)
    write_cube(os.path.join(luts_dir, 'gaming.cube'),    'Ignis Gaming',    grade_gaming)
    write_cube(os.path.join(luts_dir, 'product.cube'),   'Ignis Product',   grade_product)
    write_cube(os.path.join(luts_dir, 'zenith.cube'),    'Ignis Zenith',    grade_zenith)

    print('\nGenerating SFX placeholders...')
    write_silent_wav(os.path.join(sfx_dir, 'whoosh.wav'), duration_sec=0.5)
    write_silent_wav(os.path.join(sfx_dir, 'impact.wav'), duration_sec=0.3)
    write_silent_wav(os.path.join(sfx_dir, 'riser.wav'),  duration_sec=2.0)

    # Type-specific SFX subfolders — stitch.py prefers these over the root sfx/ folder.
    # Populate each with sounds via ElevenLabs API or Freesound.org.
    # Example ElevenLabs prompts per type are listed below.
    sfx_palettes = {
        'anime':     ['whoosh', 'sword_ring', 'impact', 'energy_burst'],
        'cinematic': ['cloth_movement', 'footstep_marble', 'door_close', 'deep_riser'],
        'gaming':    ['punch_impact', 'glass_shatter', 'bell_drop', 'power_up'],
        'product':   ['soft_click', 'chime', 'whoosh_clean', 'soft_impact'],
        'zenith':    ['cinematic_hit', 'bass_drop', 'energy_riser', 'sword_ring'],
    }
    print('\nCreating type-specific SFX subfolders...')
    for sfx_type, palette in sfx_palettes.items():
        type_dir = os.path.join(sfx_dir, sfx_type)
        os.makedirs(type_dir, exist_ok=True)
        for sound_name in palette:
            path = os.path.join(type_dir, f'{sound_name}.wav')
            if not os.path.exists(path):
                write_silent_wav(path, duration_sec=0.4)
        print(f'  ✓  sfx/{sfx_type}/  [{", ".join(palette)}]')

    print('\nPhase 2 complete.')
    print('\nLUTs are ready. Use with:')
    print('  python stitch.py --data timestamps.json --lut luts/cinematic.cube')
    print('\nSFX placeholders are silent. Replace via:')
    print('  ElevenLabs: POST /v1/sound-generation  {"text": "leather shoe marble floor"}')
    print('  Freesound:  freesound.org/apiv2  (CC licensed, free)')
    print('  BBC:        bbcrewind.co.uk/sound-effects  (16k broadcast sounds, free)')
    print('\nDrop real .wav files into sfx/{type}/ to activate type-aware sound palettes.')
    print('Pipeline auto-detects the sfx/ folder — no --sfx-dir flag needed.')
